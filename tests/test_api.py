import io
import sqlite3
import time
from concurrent.futures import ThreadPoolExecutor

import numpy as np
import pytest
from fastapi.testclient import TestClient
from PIL import Image

from backend.main import create_app
from backend.database import transaction
from backend.vision import MODEL_NAME, VisionEngine

HEADERS = {'X-Requested-With': 'AcademicVision'}
ADMIN = {'username': 'admin', 'password': 'test-password-1234', 'name': 'Test Admin'}


@pytest.fixture
def client(tmp_path):
    app = create_app(tmp_path / 'data', tmp_path / 'models')
    with TestClient(app, headers=HEADERS) as client:
        yield client


def setup(client):
    response = client.post('/api/setup', json=ADMIN)
    assert response.status_code == 201, response.text
    return response


def add_student(client, student_id='S001', name='Alice Student'):
    response = client.post('/api/students', json={'id': student_id, 'name': name, 'programme': 'Computer Science', 'semester': 2, 'section': 'A', 'email': 'alice@example.org'})
    assert response.status_code == 201, response.text
    return response.json()


def course_session(client):
    course = client.post('/api/courses', json={'code': 'CS101', 'name': 'Computing'}).json()['id']
    section = client.post('/api/sections', json={'course_id': course, 'name': 'A', 'room': 'Hall 1'}).json()['id']
    assert client.put(f'/api/sections/{section}/roster', json={'student_ids': ['S001']}).status_code == 200
    response = client.post(f'/api/sections/{section}/sessions')
    assert response.status_code == 201, response.text
    return section, response.json()['id']


def grant(client):
    assert client.patch('/api/students/S001/consent', json={'consent': 'RECORDED', 'reason': 'Signed form v1'}).status_code == 200


def insert_template(client):
    vector = np.zeros(128, dtype=np.float32)
    vector[0] = 1
    encrypted = client.app.state.vision.cipher.encrypt(vector.tobytes())
    with transaction(client.app.state.db_path, True) as db:
        db.execute('INSERT INTO templates VALUES(?,?,?,?,?)', ('S001', encrypted, MODEL_NAME, 3, '2026-09-16'))
    return vector


def fake_extract(monkeypatch, client, vector):
    monkeypatch.setattr(client.app.state.vision, 'extract', lambda payload, size: (640, 480, [
        {'box': [10, 20, 100, 120], 'confidence': .99, 'embedding': vector.copy(), 'reason': ''}]))


def analyze(client, session_id):
    return client.post('/api/vision/analyze', data={'session_id': session_id}, files={'frame': ('frame.jpg', b'test-image', 'image/jpeg')})


def test_first_run_auth_persistence_and_cookie(client):
    assert client.get('/api/health').json()['setup_required'] is True
    assert client.get('/api/students').status_code == 401
    response = setup(client)
    assert 'HttpOnly' in response.headers['set-cookie']
    assert 'SameSite=strict' in response.headers['set-cookie']
    assert client.get('/api/auth/me').json()['role'] == 'ADMIN'
    assert client.post('/api/setup', json=ADMIN).status_code == 409
    assert client.get('/api/health').json()['setup_required'] is False
    saved_cookie = dict(client.cookies)
    with TestClient(create_app(client.app.state.db_path.parent), headers=HEADERS, cookies=saved_cookie) as restarted:
        assert restarted.get('/api/auth/me').status_code == 200
    assert client.post('/api/auth/logout').status_code == 204
    assert client.get('/api/auth/me').status_code == 401
    assert client.post('/api/auth/login', json={'username': 'admin', 'password': 'bad'}).status_code == 401
    assert client.post('/api/auth/login', json={'username': 'ADMIN', 'password': ADMIN['password']}).status_code == 200
    with transaction(client.app.state.db_path) as db:
        assert db.execute('SELECT password FROM users').fetchone()[0] != ADMIN['password']
        assert db.execute('SELECT token_hash FROM auth_sessions').fetchone()[0] != client.cookies.get('attendance_session')


def test_expired_session_rejected(client):
    setup(client)
    with transaction(client.app.state.db_path, True) as db:
        db.execute('UPDATE auth_sessions SET expires=?', (time.time() - 1,))
    assert client.get('/api/students').status_code == 401


def test_csrf_and_bad_host(client):
    response = client.post('/api/setup', json=ADMIN, headers={'Origin': 'https://untrusted.example'})
    assert response.status_code == 403
    with TestClient(client.app) as no_header:
        assert no_header.post('/api/setup', json=ADMIN).status_code == 403
    assert client.get('/api/health', headers={'host': 'evil.example'}).status_code == 400


def test_login_rate_limited(client):
    setup(client)
    client.post('/api/auth/logout')
    for _ in range(10):
        assert client.post('/api/auth/login', json={'username': 'admin', 'password': 'wrong'}).status_code == 401
    assert client.post('/api/auth/login', json={'username': 'admin', 'password': 'wrong'}).status_code == 429


def test_student_validation_and_duplicates(client):
    setup(client)
    assert client.post('/api/students', json={'id': '../escape', 'name': 'A'}).status_code == 422
    assert client.post('/api/students', json={'id': 'a', 'name': '  '}).status_code == 422
    assert client.post('/api/students', json={'id': 'a', 'name': 'A', 'email': 'invalid'}).status_code == 422
    add_student(client)
    assert client.post('/api/students', json={'id': 'S001', 'name': 'Duplicate'}).status_code == 409
    assert len(client.get('/api/students').json()) == 1
    response = client.put('/api/students/S001', json={'id': 'S001', 'name': 'Renamed', 'semester': 3})
    assert response.status_code == 200
    assert client.get('/api/students?search=Renamed').json()[0]['semester'] == 3
    assert client.put('/api/students/S001', json={'id': 'S002', 'name': 'Renamed'}).status_code == 200


@pytest.mark.parametrize('role', ['OPERATOR', 'VIEWER'])
def test_roles_enforced(client, role):
    setup(client)
    add_student(client)
    _, session_id = course_session(client)
    result = client.post('/api/users', json={'username': 'staff', 'password': 'staff-password-123', 'name': 'Staff', 'role': role})
    assert result.status_code == 201
    client.post('/api/auth/logout')
    assert client.post('/api/auth/login', json={'username': 'staff', 'password': 'staff-password-123'}).status_code == 200
    assert client.get('/api/students').status_code == 200
    assert client.get('/api/reports').status_code == 200
    assert client.get('/api/audit').status_code == 403
    assert client.post('/api/students', json={'id': 'B', 'name': 'B'}).status_code == 403
    assert client.delete('/api/students/S001').status_code == 403
    response = client.patch(f'/api/sessions/{session_id}/attendance', json={'student_id': 'S001', 'status': 'Present', 'reason': 'Checked manually'})
    assert response.status_code == (200 if role == 'OPERATOR' else 403)


def test_account_deactivation_revokes_sessions(client):
    setup(client)
    uid = client.post('/api/users', json={'username': 'staff', 'password': 'staff-password-123', 'name': 'Staff', 'role': 'OPERATOR'}).json()['id']
    with TestClient(client.app, headers=HEADERS) as staff:
        staff.post('/api/auth/login', json={'username': 'staff', 'password': 'staff-password-123'})
        assert staff.get('/api/auth/me').status_code == 200
        assert client.delete('/api/users/' + str(uid)).status_code == 204
        assert staff.get('/api/auth/me').status_code == 401
    assert client.delete('/api/users/1').status_code == 409


def test_session_snapshot_corrections_close_and_export(client):
    setup(client)
    add_student(client)
    section, session_id = course_session(client)
    assert client.post(f'/api/sections/{section}/sessions').status_code == 409
    assert client.put(f'/api/sections/{section}/roster', json={'student_ids': []}).status_code == 200
    assert len(client.get(f'/api/sessions/{session_id}/roster').json()) == 1
    for status in ['Present', 'Late']:
        assert client.patch(f'/api/sessions/{session_id}/attendance', json={'student_id': 'S001', 'status': status, 'reason': 'Operator verified'}).status_code == 200
    assert client.get('/api/sessions').json()[0]['present'] == 1
    assert client.patch(f'/api/sessions/{session_id}/attendance', json={'student_id': 'S001', 'status': 'Absent', 'reason': ''}).status_code == 422
    assert client.post(f'/api/sessions/{session_id}/close').status_code == 200
    assert client.patch(f'/api/sessions/{session_id}/attendance', json={'student_id': 'S001', 'status': 'Present', 'reason': 'Operator verified'}).status_code == 409
    assert client.post(f'/api/sessions/{session_id}/close').status_code == 409
    exported = client.get('/api/reports/export')
    assert exported.status_code == 200 and 'text/csv' in exported.headers['content-type']
    assert 'Alice Student' in exported.text and 'Late' in exported.text
    audit = client.get('/api/audit').json()
    changes = [event for event in audit if event['action'] == 'ATTENDANCE_UPDATED']
    assert len(changes) == 2 and '"before": "Present"' in changes[0]['details']


def test_roster_replace_atomic_and_csv_formula_safe(client):
    setup(client)
    add_student(client, name='=DANGEROUS()')
    section, session_id = course_session(client)
    assert client.put(f'/api/sections/{section}/roster', json={'student_ids': ['unknown']}).status_code == 404
    assert len(client.get(f'/api/sections/{section}/roster').json()) == 1
    assert "'=DANGEROUS()" in client.get('/api/reports/export').text
    assert client.get('/api/reports?session_id=unknown').status_code == 404


def test_recognition_dedup_review_and_no_automatic_attendance(client, monkeypatch):
    setup(client)
    add_student(client)
    grant(client)
    _, sid = course_session(client)
    vector = insert_template(client)
    fake_extract(monkeypatch, client, vector)
    for _ in range(2):
        response = analyze(client, sid)
        assert response.status_code == 200, response.text
        assert response.json()['detections'][0]['state'] == 'REVIEW'
    assert client.get(f'/api/sessions/{sid}/roster').json()[0]['status'] == 'Unmarked'
    reviews = client.get('/api/reviews').json()
    assert len(reviews) == 1
    assert client.post(f'/api/sessions/{sid}/close').status_code == 409
    review_id = reviews[0]['id']
    assert client.patch('/api/reviews/' + review_id, json={'status': 'confirmed', 'reason': 'Identity verified in classroom'}).status_code == 200
    assert client.patch('/api/reviews/' + review_id, json={'status': 'confirmed', 'reason': 'Repeated decision'}).status_code == 409
    row = client.get(f'/api/sessions/{sid}/roster').json()[0]
    assert row['status'] == 'Present' and row['method'] == 'FACE_REVIEWED'
    assert analyze(client, sid).json()['detections'][0]['state'] == 'ALREADY_MARKED'


def test_consent_withdrawal_purges_template_and_pending_review(client, monkeypatch):
    setup(client)
    add_student(client)
    grant(client)
    _, sid = course_session(client)
    fake_extract(monkeypatch, client, insert_template(client))
    analyze(client, sid)
    assert client.patch('/api/students/S001/consent', json={'consent': 'WITHDRAWN', 'reason': 'Student requested withdrawal'}).status_code == 200
    assert client.get('/api/students').json()[0]['template'] == 'Not enrolled'
    assert client.get('/api/reviews').json()[0]['status'] == 'rejected'
    assert analyze(client, sid).json()['detections'][0]['state'] == 'UNMATCHED'
    # Manual attendance remains available without biometric consent.
    assert client.patch(f'/api/sessions/{sid}/attendance', json={'student_id': 'S001', 'status': 'Present', 'reason': 'Manual identity check'}).status_code == 200


def test_inactive_student_cannot_be_marked(client):
    setup(client)
    add_student(client)
    _, sid = course_session(client)
    assert client.delete('/api/students/S001').status_code == 204
    assert client.patch(f'/api/sessions/{sid}/attendance', json={'student_id': 'S001', 'status': 'Present', 'reason': 'Manual identity check'}).status_code == 409
    assert client.get(f'/api/sessions/{sid}/roster').json()[0]['student_name'] == 'Alice Student'


def test_bad_upload_and_no_consent(client):
    setup(client)
    add_student(client)
    photos = [('photos', (str(i) + '.jpg', b'bad-image-' + str(i).encode(), 'image/jpeg')) for i in range(3)]
    assert client.post('/api/students/S001/enrollment', files=photos).status_code == 409
    grant(client)
    assert client.post('/api/students/S001/enrollment', files=photos).status_code == 422
    assert client.get('/api/students').json()[0]['template'] == 'Not enrolled'
    _, sid = course_session(client)
    assert analyze(client, sid).status_code == 422


def test_enrollment_encrypts_and_keeps_no_source_photos(client, monkeypatch):
    setup(client)
    add_student(client)
    grant(client)
    vector = np.ones(128, dtype=np.float32) / np.sqrt(128)
    fake_extract(monkeypatch, client, vector)
    photos = [('photos', (str(i) + '.jpg', b'example-' + str(i).encode(), 'image/jpeg')) for i in range(3)]
    response = client.post('/api/students/S001/enrollment', files=photos)
    assert response.status_code == 200, response.text
    assert response.json()['samples'] == 3
    with transaction(client.app.state.db_path) as db:
        template = db.execute('SELECT encrypted FROM templates').fetchone()[0]
        assert template != vector.tobytes()
        assert len(client.app.state.vision.decrypt(template)) == 128
    assert not list(client.app.state.db_path.parent.rglob('*.jpg'))


def test_settings_validation_and_persistence(client):
    setup(client)
    settings = client.get('/api/settings').json()
    assert client.put('/api/settings', json={**settings, 'recognition_threshold': 2}).status_code == 422
    assert client.put('/api/settings', json={**settings, 'recognition_threshold': .6, 'institution': 'Test College'}).status_code == 200
    assert client.get('/api/settings').json()['institution'] == 'Test College'


def test_engine_rejects_duplicates_and_invalid_images(tmp_path):
    engine = VisionEngine(tmp_path / 'models', tmp_path)
    with pytest.raises(ValueError, match='Duplicate'):
        engine.enroll([b'same'] * 3, 70)
    with pytest.raises(ValueError, match='JPEG or PNG'):
        engine.extract(b'bad image')
    with pytest.raises(ValueError, match='8 MB'):
        engine.extract(b'x' * (8 * 1024 * 1024 + 1))


def test_real_model_loading_and_blank_image(tmp_path):
    from pathlib import Path
    model_dir = Path(__file__).resolve().parents[1] / 'models'
    if not (model_dir / 'face_detection_yunet.onnx').exists():
        pytest.skip('Local ONNX models are not installed')
    engine = VisionEngine(model_dir, tmp_path)
    image = io.BytesIO()
    Image.new('RGB', (640, 480)).save(image, format='PNG')
    width, height, faces = engine.extract(image.getvalue())
    assert (width, height, faces) == (640, 480, [])

def test_password_whitespace_is_significant(client):
    credentials = {**ADMIN, 'password': '  password-with-spaces  '}
    assert client.post('/api/setup', json=credentials).status_code == 201
    client.post('/api/auth/logout')
    assert client.post('/api/auth/login', json={'username': 'admin', 'password': 'password-with-spaces'}).status_code == 401
    assert client.post('/api/auth/login', json={'username': 'admin', 'password': credentials['password']}).status_code == 200


def test_concurrent_session_creation_is_unique(client):
    setup(client)
    add_student(client)
    section, sid = course_session(client)
    assert client.post(f'/api/sessions/{sid}/close').status_code == 200
    with ThreadPoolExecutor(max_workers=2) as pool:
        statuses = list(pool.map(lambda _: client.post(f'/api/sections/{section}/sessions').status_code, range(2)))
    assert sorted(statuses) == [201, 409]


def test_camera_url_encryption_and_capture(client, monkeypatch):
    import backend.main as main
    setup(client)
    add_student(client)
    grant(client)
    _, sid = course_session(client)
    fake_extract(monkeypatch, client, insert_template(client))
    camera = client.post('/api/cameras', json={'name': 'Hall Camera', 'url': 'rtsp://operator:secret@10.0.0.1/live'})
    assert camera.status_code == 201
    camera_id = camera.json()['id']
    assert 'secret' not in client.get('/api/cameras').text
    with transaction(client.app.state.db_path) as db:
        stored = db.execute('SELECT encrypted_url FROM cameras').fetchone()[0]
        assert b'secret' not in stored
    monkeypatch.setattr(main, 'capture_snapshot', lambda url: b'camera-frame')
    response = client.post('/api/cameras/' + camera_id + '/analyze', json={'session_id': sid})
    assert response.status_code == 200, response.text
    assert response.json()['image'].startswith('data:image/jpeg;base64,')
    assert response.json()['detections'][0]['state'] == 'REVIEW'
    assert client.delete('/api/cameras/' + camera_id).status_code == 204
    assert client.post('/api/cameras/' + camera_id + '/analyze', json={'session_id': sid}).status_code == 404


@pytest.mark.parametrize('url', ['file:///etc/passwd', 'https://example.org', 'not-a-url', 'rtsp://'])
def test_camera_rejects_non_rtsp_sources(client, url):
    setup(client)
    assert client.post('/api/cameras', json={'name': 'Invalid camera', 'url': url}).status_code == 422


def test_request_size_limit(client):
    assert client.post('/api/setup', content=b'{}', headers={'Content-Length': str(90 * 1024 * 1024)}).status_code == 413


def test_pixel_limit_checked_before_opencv(tmp_path, monkeypatch):
    import backend.vision as module
    image = io.BytesIO()
    Image.new('RGB', (4001, 4001)).save(image, format='PNG')
    monkeypatch.setattr(module.cv2, 'imdecode', lambda *args: pytest.fail('Oversized image reached OpenCV decoder'))
    engine = VisionEngine(tmp_path / 'models', tmp_path)
    with pytest.raises(ValueError, match='16 megapixels'):
        engine.extract(image.getvalue())


def test_password_change_revokes_other_sessions(client):
    setup(client)
    with TestClient(client.app, headers=HEADERS) as other:
        other.post('/api/auth/login', json={'username': 'admin', 'password': ADMIN['password']})
        assert client.post('/api/auth/password', json={'old_password': 'wrong', 'new_password': 'changed-password-123'}).status_code == 403
        assert other.get('/api/auth/me').status_code == 200
        assert client.post('/api/auth/password', json={'old_password': ADMIN['password'], 'new_password': 'changed-password-123'}).status_code == 200
        assert other.get('/api/auth/me').status_code == 401
        assert client.get('/api/auth/me').status_code == 200
    client.post('/api/auth/logout')
    assert client.post('/api/auth/login', json={'username': 'admin', 'password': ADMIN['password']}).status_code == 401
    assert client.post('/api/auth/login', json={'username': 'admin', 'password': 'changed-password-123'}).status_code == 200


def test_preview_without_session_matches_and_never_saves_attendance(client, monkeypatch):
    setup(client)
    add_student(client)
    grant(client)
    fake_extract(monkeypatch, client, insert_template(client))
    response = client.post('/api/vision/analyze', files={'frame': ('frame.jpg', b'fixture', 'image/jpeg')})
    assert response.status_code == 200, response.text
    result = response.json()
    assert result['mode'] == 'preview'
    assert result['eligible_students'] == 1
    assert result['detections'][0]['name'] == 'Alice Student'
    assert result['detections'][0]['state'] == 'MATCHED'
    assert result['detections'][0]['review_id'] is None
    assert client.get('/api/reviews').json() == []
    assert client.get('/api/reports').json() == []
    assert client.get('/api/sessions').json() == []


def test_preview_without_templates_still_detects_faces(client, monkeypatch):
    setup(client)
    fake_extract(monkeypatch, client, np.ones(128, dtype=np.float32))
    result = client.post('/api/vision/analyze', files={'frame': ('frame.jpg', b'fixture', 'image/jpeg')}).json()
    assert result['eligible_students'] == 0
    assert len(result['detections']) == 1
    assert result['detections'][0]['state'] == 'DETECTED'
    assert result['detections'][0]['box'] == [10, 20, 100, 120]


def test_preview_excludes_withdrawn_students_and_invalid_session_still_rejected(client, monkeypatch):
    setup(client)
    add_student(client)
    grant(client)
    fake_extract(monkeypatch, client, insert_template(client))
    client.patch('/api/students/S001/consent', json={'consent': 'WITHDRAWN', 'reason': 'Withdrawn by student'})
    response = client.post('/api/vision/analyze', files={'frame': ('frame.jpg', b'fixture', 'image/jpeg')})
    assert response.json()['eligible_students'] == 0
    assert response.json()['detections'][0]['name'] is None
    assert analyze(client, 'missing-session').status_code == 404


def test_full_name_and_sap_id_are_returned_for_recognition(client, monkeypatch):
    setup(client)
    add_student(client)
    grant(client)
    fake_extract(monkeypatch, client, insert_template(client))
    response = client.put('/api/students/S001', json={'id': 'S001', 'name': 'Alice Jane Student', 'sap_id': '00123456789'})
    assert response.status_code == 200, response.text
    assert client.get('/api/students?search=00123456789').json()[0]['name'] == 'Alice Jane Student'
    result = client.post('/api/vision/analyze', files={'frame': ('frame.jpg', b'fixture', 'image/jpeg')}).json()
    detection = result['detections'][0]
    assert detection['name'] == 'Alice Jane Student'
    assert detection['sap_id'] == '00123456789'
    assert detection['student_id'] == 'S001'
    assert client.get('/api/students').json()[0]['template'] == 'Ready'
    # Older clients that omit SAP ID must not silently erase it on profile edits.
    assert client.put('/api/students/S001', json={'id': 'S001', 'name': 'Alice Jane Student'}).status_code == 200
    assert client.get('/api/students').json()[0]['sap_id'] == '00123456789'
    _, sid = course_session(client)
    assert analyze(client, sid).json()['detections'][0]['sap_id'] == '00123456789'


def test_sap_id_unique_and_preserves_leading_zeroes(client):
    setup(client)
    for student_id in ['one', 'two']:
        result = client.post('/api/students', json={'id': student_id, 'name': student_id, 'sap_id': '00123'})
        assert result.status_code == (201 if student_id == 'one' else 409)
    assert client.get('/api/students').json()[0]['sap_id'] == '00123'
    assert client.post('/api/students', json={'id': 'three', 'name': 'No SAP ID yet'}).status_code == 201


def test_existing_database_migrates_without_inventing_sap_ids(tmp_path):
    from backend.database import SCHEMA, initialize
    path = tmp_path / 'legacy.db'
    with sqlite3.connect(path) as db:
        db.executescript(SCHEMA)
        db.execute("INSERT INTO students(id,name,programme,semester,section,created_at) VALUES('existing','Original Name','CS',1,'A','2026-09-16')")
    initialize(path)
    initialize(path)
    with sqlite3.connect(path) as db:
        assert db.execute('SELECT id,name,sap_id FROM students').fetchone() == ('existing', 'Original Name', '')
        assert db.execute('SELECT COUNT(*) FROM migrations WHERE version=2').fetchone()[0] == 1


def test_student_id_change_preserves_references_and_template(client, monkeypatch):
    setup(client)
    add_student(client)
    grant(client)
    section, sid = course_session(client)
    vector = insert_template(client)
    fake_extract(monkeypatch, client, vector)
    assert analyze(client, sid).status_code == 200
    with transaction(client.app.state.db_path) as db:
        encrypted = db.execute('SELECT encrypted FROM templates WHERE student_id=?', ('S001',)).fetchone()[0]
    response = client.put('/api/students/S001', json={'id': 'NEW001', 'name': 'Alice Updated', 'sap_id': '001234'})
    assert response.status_code == 200, response.text
    assert response.json()['id'] == 'NEW001'
    with transaction(client.app.state.db_path) as db:
        assert db.execute('PRAGMA foreign_key_check').fetchall() == []
        for table in ('templates', 'roster', 'attendance', 'reviews'):
            assert db.execute(f'SELECT student_id FROM {table}').fetchone()[0] == 'NEW001'
        assert db.execute('SELECT encrypted FROM templates').fetchone()[0] == encrypted
        assert db.execute('SELECT student_name FROM attendance').fetchone()[0] == 'Alice Student'
        assert db.execute("SELECT details FROM audit WHERE action='STUDENT_ID_CHANGED'").fetchone()[0] == 'Previous ID: S001; New ID: NEW001'
    assert client.put('/api/students/S001', json={'id': 'S001', 'name': 'Old'}).status_code == 404
    detection = analyze(client, sid).json()['detections'][0]
    assert detection['student_id'] == 'NEW001'
    assert detection['sap_id'] == '001234'
    review_id = client.get('/api/reviews').json()[0]['id']
    assert client.patch('/api/reviews/' + review_id, json={'status': 'confirmed', 'reason': 'Identity verified'}).status_code == 200
    assert client.get(f'/api/sessions/{sid}/roster').json()[0]['status'] == 'Present'
    assert client.post(f'/api/sessions/{sid}/close').status_code == 200
    assert client.put('/api/students/NEW001', json={'id': 'FINAL001', 'name': 'Alice Updated'}).status_code == 200
    roster = client.get(f'/api/sessions/{sid}/roster').json()[0]
    assert roster['student_id'] == 'FINAL001' and roster['status'] == 'Present'


def test_student_id_conflicts_roll_back_all_changes(client):
    setup(client)
    add_student(client)
    add_student(client, 'S002', 'Other')
    insert_template(client)
    assert client.put('/api/students/S002', json={'id': 'S002', 'name': 'Other', 'sap_id': '002'}).status_code == 200
    for payload in ({'id': 'S002', 'name': 'Should roll back'}, {'id': 'NEW001', 'name': 'Should roll back', 'sap_id': '002'}):
        assert client.put('/api/students/S001', json=payload).status_code == 409
        original = next(s for s in client.get('/api/students').json() if s['id'] == 'S001')
        assert original['name'] == 'Alice Student' and original['template'] == 'Ready'
        with transaction(client.app.state.db_path) as db:
            assert not db.execute("SELECT 1 FROM audit WHERE action='STUDENT_ID_CHANGED'").fetchone()
            assert db.execute('PRAGMA foreign_key_check').fetchall() == []
