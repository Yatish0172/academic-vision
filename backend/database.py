"""SQLite storage. Each request owns a connection and an atomic transaction."""
import sqlite3
from contextlib import contextmanager
from datetime import datetime, timezone


def now():
    return datetime.now(timezone.utc).isoformat(timespec="milliseconds")


SCHEMA = """
CREATE TABLE IF NOT EXISTS migrations(version INTEGER PRIMARY KEY, applied_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS users(
 id INTEGER PRIMARY KEY, username TEXT UNIQUE NOT NULL COLLATE NOCASE,
 name TEXT NOT NULL, password TEXT NOT NULL, role TEXT NOT NULL CHECK(role IN ('ADMIN','OPERATOR','VIEWER')),
 active INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS auth_sessions(
 token_hash TEXT PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id), expires REAL NOT NULL);
CREATE TABLE IF NOT EXISTS students(
 id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL DEFAULT '', programme TEXT NOT NULL,
 semester INTEGER NOT NULL CHECK(semester BETWEEN 1 AND 20), section TEXT NOT NULL,
 consent TEXT NOT NULL DEFAULT 'NOT_RECORDED' CHECK(consent IN ('RECORDED','NOT_RECORDED','WITHDRAWN')),
 status TEXT NOT NULL DEFAULT 'Active' CHECK(status IN ('Active','Inactive')), created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS templates(
 student_id TEXT PRIMARY KEY REFERENCES students(id), encrypted BLOB NOT NULL,
 model TEXT NOT NULL, samples INTEGER NOT NULL, created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS courses(
 id INTEGER PRIMARY KEY, code TEXT NOT NULL UNIQUE COLLATE NOCASE, name TEXT NOT NULL, term TEXT NOT NULL DEFAULT '');
CREATE TABLE IF NOT EXISTS sections(
 id INTEGER PRIMARY KEY, course_id INTEGER NOT NULL REFERENCES courses(id), name TEXT NOT NULL,
 room TEXT NOT NULL DEFAULT '', UNIQUE(course_id,name));
CREATE TABLE IF NOT EXISTS roster(
 section_id INTEGER NOT NULL REFERENCES sections(id), student_id TEXT NOT NULL REFERENCES students(id),
 PRIMARY KEY(section_id,student_id));
CREATE TABLE IF NOT EXISTS sessions(
 id TEXT PRIMARY KEY, section_id INTEGER NOT NULL REFERENCES sections(id),
 status TEXT NOT NULL DEFAULT 'OPEN' CHECK(status IN ('OPEN','CLOSED')),
 started_at TEXT NOT NULL, ended_at TEXT, created_by INTEGER NOT NULL REFERENCES users(id));
CREATE UNIQUE INDEX IF NOT EXISTS one_open_session ON sessions(section_id) WHERE status='OPEN';
CREATE TABLE IF NOT EXISTS attendance(
 session_id TEXT NOT NULL REFERENCES sessions(id), student_id TEXT NOT NULL REFERENCES students(id),
 student_name TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'Unmarked' CHECK(status IN ('Unmarked','Present','Absent','Late','Excused')),
 method TEXT NOT NULL DEFAULT '', reason TEXT NOT NULL DEFAULT '', updated_at TEXT,
 PRIMARY KEY(session_id,student_id));
CREATE TABLE IF NOT EXISTS reviews(
 id TEXT PRIMARY KEY, session_id TEXT NOT NULL REFERENCES sessions(id), student_id TEXT REFERENCES students(id),
 score REAL, margin REAL, reason TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'pending'
 CHECK(status IN ('pending','confirmed','rejected','rescan')),
 created_at TEXT NOT NULL, resolved_at TEXT, resolved_by INTEGER REFERENCES users(id));
CREATE UNIQUE INDEX IF NOT EXISTS pending_candidate ON reviews(session_id,student_id) WHERE status='pending' AND student_id IS NOT NULL;
CREATE TABLE IF NOT EXISTS audit(
 id INTEGER PRIMARY KEY, actor INTEGER REFERENCES users(id), action TEXT NOT NULL,
 target TEXT NOT NULL DEFAULT '', details TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS cameras(id TEXT PRIMARY KEY, name TEXT NOT NULL, encrypted_url BLOB NOT NULL, created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS settings(key TEXT PRIMARY KEY, value TEXT NOT NULL);
INSERT OR IGNORE INTO settings VALUES('recognition_threshold','0.45');
INSERT OR IGNORE INTO settings VALUES('ambiguity_margin','0.08');
INSERT OR IGNORE INTO settings VALUES('min_face_size','70');
INSERT OR IGNORE INTO settings VALUES('institution','Academic Vision');
INSERT OR IGNORE INTO migrations VALUES(1,strftime('%Y-%m-%dT%H:%M:%fZ','now'));
"""


def connect(path):
    db = sqlite3.connect(path, timeout=20, check_same_thread=False)
    db.row_factory = sqlite3.Row
    db.execute("PRAGMA foreign_keys=ON")
    db.execute("PRAGMA busy_timeout=20000")
    return db


def initialize(path):
    with connect(path) as db:
        db.execute("PRAGMA journal_mode=WAL")
        db.executescript(SCHEMA)
        columns = {row['name'] for row in db.execute('PRAGMA table_info(students)')}
        if 'sap_id' not in columns:
            db.execute("ALTER TABLE students ADD COLUMN sap_id TEXT NOT NULL DEFAULT ''")
        db.execute("CREATE UNIQUE INDEX IF NOT EXISTS unique_student_sap_id ON students(sap_id) WHERE sap_id <> ''")
        db.execute('INSERT OR IGNORE INTO migrations VALUES(?,?)', (2, now()))


@contextmanager
def transaction(path, write=False):
    db = connect(path)
    try:
        if write:
            db.execute("BEGIN IMMEDIATE")
        yield db
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


def audit(db, user, action, target="", details=""):
    db.execute("INSERT INTO audit(actor,action,target,details,created_at) VALUES(?,?,?,?,?)",
               (user['id'] if user else None, action, str(target), details, now()))


def rows(db, sql, args=()):
    return [dict(row) for row in db.execute(sql, args)]
