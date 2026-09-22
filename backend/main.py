from __future__ import annotations

import csv
import base64
import io
import json
import os
import secrets
import sqlite3
import time
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Literal
from uuid import uuid4
from urllib.parse import urlsplit
import cv2

import numpy as np
from fastapi import Depends, FastAPI, File, Form, HTTPException, Request, Response, UploadFile
from fastapi.exceptions import RequestValidationError
from fastapi.security import APIKeyHeader
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, ConfigDict, Field, field_validator
from starlette.middleware.trustedhost import TrustedHostMiddleware

from .database import audit, initialize, now, rows, transaction
from .security import LoginLimiter, digest_token, password_hash, password_matches
from .vision import MODEL_NAME, VisionEngine
from .cameras import capture_snapshot
from .limits import RequestSizeLimit

ROOT = Path(__file__).resolve().parents[1]
COOKIE = 'attendance_session'


class Input(BaseModel):
    model_config = ConfigDict(extra='forbid', str_strip_whitespace=True)


class Credentials(Input):
    model_config = ConfigDict(extra='forbid', str_strip_whitespace=False)
    username: str = Field(min_length=1, max_length=60)
    password: str = Field(min_length=1, max_length=256)

    @field_validator('username', 'name', mode='before', check_fields=False)
    @classmethod
    def trim_names(cls, value):
        return value.strip() if isinstance(value, str) else value


class Setup(Credentials):
    name: str = Field(min_length=1, max_length=120)


class PasswordChange(BaseModel):
    model_config = ConfigDict(extra='forbid')
    old_password: str = Field(min_length=1, max_length=256)
    new_password: str = Field(min_length=12, max_length=256)


class UserInput(Setup):
    role: Literal['ADMIN', 'OPERATOR', 'VIEWER'] = 'OPERATOR'


class StudentInput(Input):
    sap_id: str = Field(default="", max_length=40, pattern=r"^[A-Za-z0-9_-]*$")
    id: str = Field(min_length=1, max_length=40, pattern=r'^[A-Za-z0-9_-]+$')
    name: str = Field(min_length=1, max_length=120)
    email: str = Field(default='', max_length=200)
    programme: str = Field(default='', max_length=120)
    semester: int = Field(default=1, ge=1, le=20)
    section: str = Field(default='1', min_length=1, max_length=40)

    @field_validator('email')
    @classmethod
    def email_valid(cls, value):
        if value and ('@' not in value or ' ' in value):
            raise ValueError('Enter a valid email address.')
        return value


class ConsentInput(Input):
    consent: Literal['RECORDED', 'NOT_RECORDED', 'WITHDRAWN']
    reason: str = Field(min_length=3, max_length=500)


class CourseInput(Input):
    code: str = Field(min_length=1, max_length=40)
    name: str = Field(min_length=1, max_length=120)
    term: str = Field(default='', max_length=80)


class SectionInput(Input):
    course_id: int = Field(gt=0)
    name: str = Field(min_length=1, max_length=40)
    room: str = Field(default='', max_length=120)


class RosterInput(Input):
    student_ids: list[str] = Field(max_length=2000)


class AttendanceInput(Input):
    student_id: str
    status: Literal['Present', 'Absent', 'Late', 'Excused']
    reason: str = Field(min_length=3, max_length=500)


class ReviewInput(Input):
    status: Literal['confirmed', 'rejected', 'rescan']
    student_id: str | None = None
    reason: str = Field(min_length=3, max_length=500)


class SettingsInput(Input):
    recognition_threshold: float = Field(ge=0.1, le=0.99)
    ambiguity_margin: float = Field(ge=0.01, le=0.5)
    min_face_size: int = Field(ge=40, le=500)
    institution: str = Field(min_length=1, max_length=120)


class CameraInput(Input):
    name: str = Field(min_length=1, max_length=120)
    url: str = Field(min_length=7, max_length=2048)

    @field_validator('url')
    @classmethod
    def valid_rtsp(cls, value):
        parsed = urlsplit(value)
        if parsed.scheme not in ('rtsp', 'rtsps') or not parsed.hostname or any(c.isspace() for c in value):
            raise ValueError('Use an rtsp:// or rtsps:// camera stream URL.')
        return value


class CameraAnalysisInput(Input):
    session_id: str | None = Field(default=None, min_length=1, max_length=64)


def fail(status, message):
    raise HTTPException(status, message)


def database(request: Request):
    # BEGIN IMMEDIATE serializes mutations, including read/validate/write sequences.
    with transaction(request.app.state.db_path, request.method not in ('GET', 'HEAD', 'OPTIONS')) as db:
        yield db


def current_user(request: Request, db=Depends(database)):
    token = request.cookies.get(COOKIE, '')
    user = db.execute('SELECT u.id,u.username,u.name,u.role FROM auth_sessions a JOIN users u ON u.id=a.user_id '
                      'WHERE a.token_hash=? AND a.expires>? AND u.active=1', (digest_token(token), time.time())).fetchone()
    if not user:
        fail(401, 'Sign in to continue.')
    return dict(user)


def admin(user=Depends(current_user)):
    if user['role'] != 'ADMIN':
        fail(403, 'Administrator permission is required.')
    return user


def operator(user=Depends(current_user)):
    if user['role'] not in ('ADMIN', 'OPERATOR'):
        fail(403, 'An administrator or operator must perform this action.')
    return user


def get_student(db, student_id):
    row = db.execute('SELECT * FROM students WHERE id=?', (student_id,)).fetchone()
    if not row:
        fail(404, 'Student not found.')
    return dict(row)


def get_session(db, session_id, require_open=False):
    row = db.execute('SELECT * FROM sessions WHERE id=?', (session_id,)).fetchone()
    if not row:
        fail(404, 'Attendance session not found.')
    if require_open and row['status'] != 'OPEN':
        fail(409, 'This attendance session is closed.')
    return dict(row)


def settings_values(db):
    result = {row['key']: row['value'] for row in db.execute('SELECT * FROM settings')}
    for key in ('recognition_threshold', 'ambiguity_margin'):
        result[key] = float(result[key])
    result['min_face_size'] = int(result['min_face_size'])
    return result


def write_attendance(db, user, session_id, student_id, status, reason, method='MANUAL'):
    get_session(db, session_id, True)
    if get_student(db, student_id)['status'] != 'Active':
        fail(409, 'Student is inactive.')
    old = db.execute('SELECT status FROM attendance WHERE session_id=? AND student_id=?', (session_id, student_id)).fetchone()
    if not old:
        fail(400, 'Student is not in this session roster.')
    db.execute('UPDATE attendance SET status=?,method=?,reason=?,updated_at=? WHERE session_id=? AND student_id=?',
               (status, method, reason, now(), session_id, student_id))
    audit(db, user, 'ATTENDANCE_UPDATED', session_id, json.dumps({'student_id': student_id, 'before': old['status'], 'after': status, 'reason': reason}))


def csv_response(records, fields, filename):
    output = io.StringIO(newline='')
    writer = csv.writer(output)
    writer.writerow(fields)
    for row in records:
        values = []
        for field in fields:
            value = str(row.get(field, '') if row.get(field) is not None else '')
            # Prevent spreadsheet formulas from executing when opening an exported CSV.
            if value.lstrip().startswith(('=', '+', '-', '@', '\t', '\r')):
                value = "'" + value
            values.append(value)
        writer.writerow(values)
    return Response('\ufeff' + output.getvalue(), media_type='text/csv', headers={'Content-Disposition': f'attachment; filename="{filename}"'})


def create_app(data_dir=None, models_dir=None):
    data = Path(data_dir or os.getenv('FACE_ATTENDANCE_DATA_DIR', ROOT / 'data')).resolve()
    models = Path(models_dir or os.getenv('FACE_ATTENDANCE_MODELS_DIR', ROOT / 'models')).resolve()

    @asynccontextmanager
    async def lifespan(app):
        data.mkdir(parents=True, exist_ok=True)
        initialize(data / 'attendance.db')
        app.state.db_path = data / 'attendance.db'
        app.state.vision = VisionEngine(models, data)
        yield

    app = FastAPI(title='Academic Vision API', version='1.0.0', lifespan=lifespan,
                  dependencies=[Depends(APIKeyHeader(name='X-Requested-With', auto_error=False))])
    app.state.limiter = LoginLimiter()
    secure_cookie = os.getenv('COOKIE_SECURE', 'false').lower() == 'true'
    hosts = os.getenv('ALLOWED_HOSTS', 'localhost,127.0.0.1,testserver').split(',')
    origins = set(os.getenv('ALLOWED_ORIGINS', 'http://localhost:3000,http://127.0.0.1:3000,http://localhost:8001,http://127.0.0.1:8001').split(','))
    app.add_middleware(TrustedHostMiddleware, allowed_hosts=hosts)
    app.add_middleware(RequestSizeLimit)

    @app.middleware('http')
    async def security_headers(request, call_next):
        if request.method not in ('GET', 'HEAD', 'OPTIONS'):
            origin = request.headers.get('origin')
            if origin and origin not in origins:
                return JSONResponse({'detail': 'Untrusted request origin.'}, status_code=403)
            if request.headers.get('x-requested-with') != 'AcademicVision':
                return JSONResponse({'detail': 'Required request header is missing.'}, status_code=403)
        response = await call_next(request)
        response.headers['X-Content-Type-Options'] = 'nosniff'
        response.headers['X-Frame-Options'] = 'DENY'
        response.headers['Referrer-Policy'] = 'same-origin'
        if request.url.path.startswith('/api/'):
            response.headers['Cache-Control'] = 'no-store'
        return response

    @app.exception_handler(sqlite3.IntegrityError)
    async def integrity_error(request, exc):
        return JSONResponse({'detail': 'Duplicate record or invalid reference. Refresh and check the submitted values.'}, status_code=409)

    @app.exception_handler(RequestValidationError)
    async def validation_error(request, exc):
        return JSONResponse({'detail': '; '.join('.'.join(str(x) for x in e['loc'][1:]) + ': ' + e['msg'] for e in exc.errors())}, status_code=422)

    @app.get('/api/health')
    def health(request: Request, db=Depends(database)):
        return {'status': 'ok', 'setup_required': db.execute('SELECT COUNT(*) FROM users').fetchone()[0] == 0,
                'vision': request.app.state.vision.status()}

    def set_login(response, request, db, user):
        token = secrets.token_urlsafe(32)
        db.execute('DELETE FROM auth_sessions WHERE expires<?', (time.time(),))
        old = request.cookies.get(COOKIE)
        if old:
            db.execute('DELETE FROM auth_sessions WHERE token_hash=?', (digest_token(old),))
        db.execute('INSERT INTO auth_sessions VALUES(?,?,?)', (digest_token(token), user['id'], time.time() + 28800))
        response.set_cookie(COOKIE, token, httponly=True, secure=secure_cookie, samesite='strict', max_age=28800, path='/')
        return {key: user[key] for key in ('id', 'username', 'name', 'role')}

    @app.post('/api/setup', status_code=201)
    def setup(payload: Setup, request: Request, response: Response, db=Depends(database)):
        if db.execute('SELECT 1 FROM users LIMIT 1').fetchone():
            fail(409, 'Setup is already complete. Sign in instead.')
        if len(payload.password) < 12:
            fail(422, 'Use a password of at least 12 characters.')
        cursor = db.execute('INSERT INTO users(username,name,password,role,created_at) VALUES(?,?,?,?,?)',
                            (payload.username.lower(), payload.name, password_hash(payload.password), 'ADMIN', now()))
        user = {'id': cursor.lastrowid, 'username': payload.username.lower(), 'name': payload.name, 'role': 'ADMIN'}
        audit(db, user, 'INITIAL_ADMIN_CREATED')
        return set_login(response, request, db, user)

    @app.post('/api/auth/login')
    def login(payload: Credentials, request: Request, response: Response, db=Depends(database)):
        if not app.state.limiter.allow(request.client.host):
            fail(429, 'Too many sign-in attempts. Wait one minute and retry.')
        row = db.execute('SELECT * FROM users WHERE username=? AND active=1', (payload.username.lower(),)).fetchone()
        if not row or not password_matches(payload.password, row['password']):
            fail(401, 'Invalid username or password.')
        user = dict(row)
        audit(db, user, 'LOGIN')
        return set_login(response, request, db, user)

    @app.get('/api/auth/me')
    def me(user=Depends(current_user)):
        return user

    @app.post('/api/auth/logout', status_code=204)
    def logout(request: Request, response: Response, db=Depends(database)):
        db.execute('DELETE FROM auth_sessions WHERE token_hash=?', (digest_token(request.cookies.get(COOKIE, '')),))
        response.delete_cookie(COOKIE, path='/')

    @app.post('/api/auth/password')
    def change_password(payload: PasswordChange, request: Request, response: Response, user=Depends(current_user), db=Depends(database)):
        encoded = db.execute('SELECT password FROM users WHERE id=?', (user['id'],)).fetchone()[0]
        if not password_matches(payload.old_password, encoded):
            fail(403, 'Current password is incorrect.')
        db.execute('UPDATE users SET password=? WHERE id=?', (password_hash(payload.new_password), user['id']))
        db.execute('DELETE FROM auth_sessions WHERE user_id=?', (user['id'],))
        audit(db, user, 'PASSWORD_CHANGED')
        return set_login(response, request, db, user)

    @app.get('/api/users')
    def users(user=Depends(admin), db=Depends(database)):
        return rows(db, 'SELECT id,username,name,role,active,created_at FROM users ORDER BY name')

    @app.post('/api/users', status_code=201)
    def create_user(payload: UserInput, user=Depends(admin), db=Depends(database)):
        if len(payload.password) < 12:
            fail(422, 'Use a password of at least 12 characters.')
        cursor = db.execute('INSERT INTO users(username,name,password,role,created_at) VALUES(?,?,?,?,?)',
                            (payload.username.lower(), payload.name, password_hash(payload.password), payload.role, now()))
        audit(db, user, 'USER_CREATED', cursor.lastrowid, payload.role)
        return {'id': cursor.lastrowid}

    @app.delete('/api/users/{user_id}', status_code=204)
    def deactivate_user(user_id: int, user=Depends(admin), db=Depends(database)):
        if user_id == user['id']:
            fail(409, 'You cannot deactivate your own account.')
        if not db.execute('UPDATE users SET active=0 WHERE id=? AND active=1', (user_id,)).rowcount:
            fail(404, 'Active user not found.')
        db.execute('DELETE FROM auth_sessions WHERE user_id=?', (user_id,))
        audit(db, user, 'USER_DEACTIVATED', user_id)

    @app.get('/api/students')
    def students(search: str = '', user=Depends(current_user), db=Depends(database)):
        records = rows(db, 'SELECT s.*,t.created_at enrolled_at,t.samples FROM students s LEFT JOIN templates t ON t.student_id=s.id '
                          'WHERE s.id LIKE ? OR s.name LIKE ? OR s.sap_id LIKE ? ORDER BY s.status,s.name', ('%' + search[:120] + '%',) * 3)
        for row in records:
            row['template'] = 'Ready' if row['enrolled_at'] else 'Not enrolled'
            row['avatar'] = ''
        return records

    @app.post('/api/students', status_code=201)
    def add_student(payload: StudentInput, user=Depends(admin), db=Depends(database)):
        db.execute('INSERT INTO students(id,name,email,programme,semester,section,sap_id,created_at) VALUES(?,?,?,?,?,?,?,?)',
                   (payload.id, payload.name, payload.email, payload.programme, payload.semester, payload.section, payload.sap_id, now()))
        audit(db, user, 'STUDENT_CREATED', payload.id)
        return get_student(db, payload.id)

    @app.put('/api/students/{student_id}')
    def edit_student(student_id: str, payload: StudentInput, user=Depends(admin), db=Depends(database)):
        existing = get_student(db, student_id)
        if existing['status'] != 'Active':
            fail(409, 'Inactive students cannot be edited.')
        db.execute('UPDATE students SET name=?,email=?,programme=?,semester=?,section=?,sap_id=? WHERE id=?',
                   (payload.name, payload.email, payload.programme, payload.semester, payload.section, payload.sap_id if 'sap_id' in payload.model_fields_set else existing['sap_id'], student_id))
        if student_id != payload.id:
            if db.execute('SELECT 1 FROM students WHERE id=?', (payload.id,)).fetchone():
                fail(409, 'This Student ID already belongs to another student.')
            # Keep the parent and every dependent record in this request's atomic transaction.
            db.execute('PRAGMA defer_foreign_keys=ON')
            db.execute('UPDATE students SET id=? WHERE id=?', (payload.id, student_id))
            for table in ('templates', 'roster', 'attendance', 'reviews'):
                db.execute(f'UPDATE {table} SET student_id=? WHERE student_id=?', (payload.id, student_id))
            audit(db, user, 'STUDENT_ID_CHANGED', payload.id, f'Previous ID: {student_id}; New ID: {payload.id}')
        audit(db, user, 'STUDENT_UPDATED', payload.id)
        return get_student(db, payload.id)

    @app.patch('/api/students/{student_id}/consent')
    def consent(student_id: str, payload: ConsentInput, user=Depends(admin), db=Depends(database)):
        student = get_student(db, student_id)
        if student['status'] != 'Active' and payload.consent == 'RECORDED':
            fail(409, 'Inactive students cannot grant consent.')
        db.execute('UPDATE students SET consent=? WHERE id=?', (payload.consent, student_id))
        if payload.consent != 'RECORDED':
            db.execute('DELETE FROM templates WHERE student_id=?', (student_id,))
            db.execute("UPDATE reviews SET status='rejected',resolved_at=?,resolved_by=? WHERE student_id=? AND status='pending'", (now(), user['id'], student_id))
        audit(db, user, 'CONSENT_UPDATED', student_id, payload.consent + ': ' + payload.reason)
        return get_student(db, student_id)

    @app.delete('/api/students/{student_id}', status_code=204)
    def remove_student(student_id: str, user=Depends(admin), db=Depends(database)):
        get_student(db, student_id)
        db.execute("UPDATE students SET status='Inactive',consent='WITHDRAWN' WHERE id=?", (student_id,))
        db.execute('DELETE FROM templates WHERE student_id=?', (student_id,))
        db.execute("UPDATE reviews SET status='rejected',resolved_at=?,resolved_by=? WHERE student_id=? AND status='pending'", (now(), user['id'], student_id))
        audit(db, user, 'STUDENT_DEACTIVATED_AND_TEMPLATE_PURGED', student_id)

    @app.get('/api/courses')
    def courses(user=Depends(current_user), db=Depends(database)):
        return {'courses': rows(db, 'SELECT * FROM courses ORDER BY code'),
                'sections': rows(db, 'SELECT s.*,c.code,c.name course_name,(SELECT COUNT(*) FROM roster r WHERE r.section_id=s.id) roster_count '
                                    'FROM sections s JOIN courses c ON c.id=s.course_id ORDER BY c.code,s.name')}

    @app.post('/api/courses', status_code=201)
    def add_course(payload: CourseInput, user=Depends(admin), db=Depends(database)):
        cursor = db.execute('INSERT INTO courses(code,name,term) VALUES(?,?,?)', (payload.code, payload.name, payload.term))
        audit(db, user, 'COURSE_CREATED', cursor.lastrowid)
        return {'id': cursor.lastrowid}

    @app.post('/api/sections', status_code=201)
    def add_section(payload: SectionInput, user=Depends(admin), db=Depends(database)):
        cursor = db.execute('INSERT INTO sections(course_id,name,room) VALUES(?,?,?)', (payload.course_id, payload.name, payload.room))
        audit(db, user, 'SECTION_CREATED', cursor.lastrowid)
        return {'id': cursor.lastrowid}

    @app.get('/api/sections/{section_id}/roster')
    def roster(section_id: int, user=Depends(current_user), db=Depends(database)):
        return rows(db, 'SELECT s.* FROM roster r JOIN students s ON s.id=r.student_id WHERE r.section_id=? ORDER BY s.name', (section_id,))

    @app.put('/api/sections/{section_id}/roster')
    def save_roster(section_id: int, payload: RosterInput, user=Depends(admin), db=Depends(database)):
        if not db.execute('SELECT 1 FROM sections WHERE id=?', (section_id,)).fetchone():
            fail(404, 'Section not found.')
        for student_id in set(payload.student_ids):
            if get_student(db, student_id)['status'] != 'Active':
                fail(409, 'Only active students can be added to a roster.')
        db.execute('DELETE FROM roster WHERE section_id=?', (section_id,))
        db.executemany('INSERT INTO roster VALUES(?,?)', [(section_id, sid) for sid in set(payload.student_ids)])
        audit(db, user, 'ROSTER_UPDATED', section_id, f'{len(set(payload.student_ids))} students')
        return {'count': len(set(payload.student_ids))}

    @app.get('/api/sessions')
    def sessions(user=Depends(current_user), db=Depends(database)):
        return rows(db, "SELECT s.*,c.code,c.name course,sec.name section,sec.room,COUNT(a.student_id) total,"
                        "COALESCE(SUM(a.status IN ('Present','Late')),0) present FROM sessions s JOIN sections sec ON sec.id=s.section_id "
                        'JOIN courses c ON c.id=sec.course_id LEFT JOIN attendance a ON a.session_id=s.id GROUP BY s.id ORDER BY s.started_at DESC')

    @app.post('/api/sections/{section_id}/sessions', status_code=201)
    def start_session(section_id: int, user=Depends(operator), db=Depends(database)):
        if not db.execute('SELECT 1 FROM sections WHERE id=?', (section_id,)).fetchone():
            fail(404, 'Section not found.')
        roster = rows(db, "SELECT s.id,s.name FROM roster r JOIN students s ON s.id=r.student_id WHERE r.section_id=? AND s.status='Active'", (section_id,))
        if not roster:
            fail(409, 'Add active students to this section roster before starting a session.')
        session_id = uuid4().hex
        db.execute('INSERT INTO sessions(id,section_id,started_at,created_by) VALUES(?,?,?,?)', (session_id, section_id, now(), user['id']))
        db.executemany('INSERT INTO attendance(session_id,student_id,student_name) VALUES(?,?,?)', [(session_id, s['id'], s['name']) for s in roster])
        audit(db, user, 'SESSION_STARTED', session_id)
        return {'id': session_id}

    @app.get('/api/sessions/{session_id}/roster')
    def session_roster(session_id: str, user=Depends(current_user), db=Depends(database)):
        get_session(db, session_id)
        return rows(db, 'SELECT a.*,s.status student_status FROM attendance a JOIN students s ON s.id=a.student_id WHERE a.session_id=? ORDER BY a.student_name', (session_id,))

    @app.patch('/api/sessions/{session_id}/attendance')
    def update_attendance(session_id: str, payload: AttendanceInput, user=Depends(operator), db=Depends(database)):
        write_attendance(db, user, session_id, payload.student_id, payload.status, payload.reason)
        return {'ok': True}

    @app.post('/api/sessions/{session_id}/close')
    def close_session(session_id: str, user=Depends(operator), db=Depends(database)):
        get_session(db, session_id, True)
        if db.execute("SELECT 1 FROM reviews WHERE session_id=? AND status='pending' LIMIT 1", (session_id,)).fetchone():
            fail(409, 'Resolve pending review items before closing this session.')
        db.execute("UPDATE sessions SET status='CLOSED',ended_at=? WHERE id=?", (now(), session_id))
        audit(db, user, 'SESSION_CLOSED', session_id, 'Unmarked records are preserved for reporting.')
        return {'ok': True}

    @app.get('/api/reviews')
    def reviews(user=Depends(current_user), db=Depends(database)):
        return rows(db, 'SELECT r.*,s.name student_name FROM reviews r LEFT JOIN students s ON s.id=r.student_id ORDER BY r.created_at DESC LIMIT 500')

    @app.patch('/api/reviews/{review_id}')
    def resolve_review(review_id: str, payload: ReviewInput, user=Depends(operator), db=Depends(database)):
        item = db.execute('SELECT * FROM reviews WHERE id=?', (review_id,)).fetchone()
        if not item:
            fail(404, 'Review item not found.')
        if item['status'] != 'pending':
            fail(409, 'This review item has already been resolved.')
        get_session(db, item['session_id'], True)
        student_id = payload.student_id or item['student_id']
        if payload.status == 'confirmed':
            if not student_id:
                fail(422, 'Select a student from the session roster.')
            if get_student(db, student_id)['consent'] != 'RECORDED':
                fail(409, 'Biometric consent is not recorded. Use manual attendance instead.')
            write_attendance(db, user, item['session_id'], student_id, 'Present', payload.reason, 'FACE_REVIEWED')
        db.execute('UPDATE reviews SET status=?,student_id=?,resolved_at=?,resolved_by=? WHERE id=?',
                   (payload.status, student_id, now(), user['id'], review_id))
        audit(db, user, 'REVIEW_' + payload.status.upper(), review_id, payload.reason)
        return {'ok': True}

    @app.get('/api/settings')
    def settings(user=Depends(current_user), db=Depends(database)):
        return settings_values(db)

    @app.put('/api/settings')
    def save_settings(payload: SettingsInput, user=Depends(admin), db=Depends(database)):
        db.executemany('UPDATE settings SET value=? WHERE key=?', [(str(value), key) for key, value in payload.model_dump().items()])
        audit(db, user, 'SETTINGS_UPDATED', details=payload.model_dump_json())
        return settings_values(db)

    @app.get('/api/audit')
    def audit_log(user=Depends(admin), db=Depends(database)):
        return rows(db, 'SELECT a.*,u.name actor_name FROM audit a LEFT JOIN users u ON u.id=a.actor ORDER BY a.id DESC LIMIT 500')

    @app.get('/api/dashboard')
    def dashboard(user=Depends(current_user), db=Depends(database)):
        def count(sql):
            return db.execute(sql).fetchone()[0]
        return {'students': count("SELECT COUNT(*) FROM students WHERE status='Active'"),
                'enrolled': count('SELECT COUNT(*) FROM templates'),
                'open_sessions': count("SELECT COUNT(*) FROM sessions WHERE status='OPEN'"),
                'pending_reviews': count("SELECT COUNT(*) FROM reviews WHERE status='pending'"),
                'attendance': rows(db, 'SELECT status,COUNT(*) count FROM attendance GROUP BY status')}

    @app.get('/api/reports')
    def reports(session_id: str | None = None, user=Depends(current_user), db=Depends(database)):
        if session_id:
            get_session(db, session_id)
        return rows(db, 'SELECT a.*,s.started_at,s.status session_status,c.code course,sec.name section FROM attendance a '
                        'JOIN sessions s ON s.id=a.session_id JOIN sections sec ON sec.id=s.section_id '
                        'JOIN courses c ON c.id=sec.course_id WHERE (? IS NULL OR a.session_id=?) ORDER BY s.started_at DESC,a.student_name', (session_id, session_id))

    @app.get('/api/reports/export')
    def export_report(session_id: str | None = None, user=Depends(current_user), db=Depends(database)):
        data = reports(session_id, user, db)
        return csv_response(data, ['session_id', 'course', 'section', 'started_at', 'student_id', 'student_name', 'status', 'method', 'reason', 'updated_at'], 'attendance.csv')

    @app.post('/api/students/{student_id}/enrollment')
    def enroll(student_id: str, request: Request, photos: list[UploadFile] = File(...), user=Depends(admin), db=Depends(database)):
        student = get_student(db, student_id)
        if student['status'] != 'Active' or student['consent'] != 'RECORDED':
            fail(409, 'Enrollment requires an active student with recorded consent.')
        if not 3 <= len(photos) <= 10:
            fail(422, 'Upload 3–10 distinct photos.')
        payloads = [photo.file.read(8 * 1024 * 1024 + 1) for photo in photos]
        try:
            encrypted = request.app.state.vision.enroll(payloads, settings_values(db)['min_face_size'])
        except ValueError as exc:
            fail(422, str(exc))
        except (RuntimeError, OSError, cv2.error) as exc:
            fail(503, str(exc))
        db.execute('INSERT INTO templates VALUES(?,?,?,?,?) ON CONFLICT(student_id) DO UPDATE SET '
                   'encrypted=excluded.encrypted,model=excluded.model,samples=excluded.samples,created_at=excluded.created_at',
                   (student_id, encrypted, MODEL_NAME, len(photos), now()))
        audit(db, user, 'BIOMETRIC_ENROLLED', student_id, f'{len(photos)} samples; {MODEL_NAME}; source photos discarded')
        return {'student_id': student_id, 'samples': len(photos), 'model': MODEL_NAME}

    @app.post('/api/vision/analyze')
    def analyze(request: Request, frame: UploadFile = File(...), session_id: str | None = Form(default=None), user=Depends(operator), db=Depends(database)):
        return analyze_payload(request, frame.file.read(8 * 1024 * 1024 + 1), session_id, user, db)

    def analyze_payload(request, payload, session_id, user, db):
        session_id = session_id or None
        if session_id:
            get_session(db, session_id, True)
        engine = request.app.state.vision
        config = settings_values(db)
        try:
            width, height, detections = engine.extract(payload, config['min_face_size'])
        except ValueError as exc:
            fail(422, str(exc))
        except (RuntimeError, OSError, cv2.error) as exc:
            fail(503, str(exc))
        if session_id:
            templates = rows(db, "SELECT t.*,s.name,s.sap_id FROM templates t JOIN students s ON s.id=t.student_id JOIN attendance a ON a.student_id=s.id "
                                 "WHERE a.session_id=? AND s.status='Active' AND s.consent='RECORDED' AND t.model=?", (session_id, MODEL_NAME))
        else:
            templates = rows(db, "SELECT t.*,s.name,s.sap_id FROM templates t JOIN students s ON s.id=t.student_id "
                                 "WHERE s.status='Active' AND s.consent='RECORDED' AND t.model=?", (MODEL_NAME,))
        vectors = [(t, engine.decrypt(t['encrypted'])) for t in templates]
        output = []
        for detection in detections:
            embedding = detection.pop('embedding')
            detection.update({'student_id': None, 'name': None, 'sap_id': None, 'score': None, 'margin': None, 'review_id': None, 'state': 'UNMATCHED'})
            if embedding is not None and vectors:
                ranked = sorted([(float(np.dot(embedding, vector)), t) for t, vector in vectors], key=lambda pair: pair[0], reverse=True)
                score, candidate = ranked[0]
                margin = score - (ranked[1][0] if len(ranked) > 1 else -1)
                detection.update({'score': score, 'margin': margin})
                if score >= config['recognition_threshold'] and margin >= config['ambiguity_margin']:
                    detection.update({'student_id': candidate['student_id'], 'name': candidate['name'], 'sap_id': candidate['sap_id'], 'state': 'REVIEW', 'reason': 'Candidate match; verify identity before confirming attendance.'})
                    if session_id is None:
                        detection.update({'state': 'MATCHED', 'reason': 'Recognition preview only. Select an open session to record attendance.'})
                        output.append(detection)
                        continue
                    record = db.execute('SELECT status FROM attendance WHERE session_id=? AND student_id=?', (session_id, candidate['student_id'])).fetchone()
                    if record['status'] in ('Present', 'Late'):
                        detection['state'] = 'ALREADY_MARKED'
                    else:
                        existing = db.execute("SELECT id FROM reviews WHERE session_id=? AND student_id=? AND status='pending'", (session_id, candidate['student_id'])).fetchone()
                        review_id = existing['id'] if existing else uuid4().hex
                        if not existing:
                            db.execute('INSERT INTO reviews(id,session_id,student_id,score,margin,reason,created_at) VALUES(?,?,?,?,?,?,?)',
                                       (review_id, session_id, candidate['student_id'], score, margin, detection['reason'], now()))
                            audit(db, user, 'RECOGNITION_CANDIDATE', review_id, f'session={session_id}; candidate={candidate["student_id"]}')
                        detection['review_id'] = review_id
                else:
                    detection['reason'] = 'No sufficiently distinct match. Retake the image or use manual attendance.'
            elif not detection['reason']:
                detection['state'] = 'DETECTED' if session_id is None else 'UNMATCHED'
                detection['reason'] = ('No enrolled, consenting students in this session roster.' if session_id else 'Face detected. Enroll a consenting student to recognize their name.')
            elif embedding is None:
                detection['state'] = 'QUALITY_CHECK'
            output.append(detection)
        return {'width': width, 'height': height, 'detections': output,
                'mode': 'attendance' if session_id else 'preview', 'eligible_students': len(templates)}

    @app.get('/api/cameras')
    def cameras(user=Depends(current_user), db=Depends(database)):
        return rows(db, 'SELECT id,name,created_at FROM cameras ORDER BY name')

    @app.post('/api/cameras', status_code=201)
    def add_camera(payload: CameraInput, request: Request, user=Depends(admin), db=Depends(database)):
        camera_id = uuid4().hex
        encrypted = request.app.state.vision.cipher.encrypt(payload.url.encode())
        db.execute('INSERT INTO cameras VALUES(?,?,?,?)', (camera_id, payload.name, encrypted, now()))
        audit(db, user, 'CAMERA_CREATED', camera_id, payload.name)
        return {'id': camera_id, 'name': payload.name}

    @app.delete('/api/cameras/{camera_id}', status_code=204)
    def delete_camera(camera_id: str, user=Depends(admin), db=Depends(database)):
        if not db.execute('DELETE FROM cameras WHERE id=?', (camera_id,)).rowcount:
            fail(404, 'Camera not found.')
        audit(db, user, 'CAMERA_DELETED', camera_id)

    @app.post('/api/cameras/{camera_id}/analyze')
    def analyze_camera(camera_id: str, payload: CameraAnalysisInput, request: Request, user=Depends(operator), db=Depends(database)):
        if payload.session_id:
            get_session(db, payload.session_id, True)
        camera = db.execute('SELECT encrypted_url FROM cameras WHERE id=?', (camera_id,)).fetchone()
        if not camera:
            fail(404, 'Camera not found.')
        url = request.app.state.vision.cipher.decrypt(camera['encrypted_url']).decode()
        try:
            frame = capture_snapshot(url)
        except RuntimeError as exc:
            fail(503, str(exc))
        result = analyze_payload(request, frame, payload.session_id, user, db)
        result['image'] = 'data:image/jpeg;base64,' + base64.b64encode(frame).decode('ascii')
        return result

    # A built frontend is served by the same process for a single-origin production setup.
    if (ROOT / 'dist').is_dir():
        app.mount('/', StaticFiles(directory=ROOT / 'dist', html=True), name='frontend')
    return app


app = create_app()
