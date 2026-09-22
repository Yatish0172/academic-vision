"""Take a consistent SQLite backup and copy its encryption key; run on the API host."""
import argparse
import os
import shutil
import sqlite3
from datetime import datetime, timezone
from pathlib import Path

root = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('destination', type=Path)
args = parser.parse_args()
source = Path(os.getenv('FACE_ATTENDANCE_DATA_DIR', root / 'data'))
if not (source / 'attendance.db').exists():
    parser.error('No attendance database exists at the configured data directory.')
destination = args.destination / datetime.now(timezone.utc).strftime('attendance-%Y%m%dT%H%M%S-%fZ')
destination.mkdir(parents=True, exist_ok=False)
with sqlite3.connect(f'file:{(source / "attendance.db").as_posix()}?mode=ro', uri=True) as original:
    with sqlite3.connect(destination / 'attendance.db') as backup:
        original.backup(backup)
if os.getenv('FACE_ATTENDANCE_KEY'):
    print('External FACE_ATTENDANCE_KEY is in use. Back it up separately in your secret manager.')
elif (source / '.embedding.key').exists():
    shutil.copy2(source / '.embedding.key', destination / '.embedding.key')
    (destination / '.embedding.key').chmod(0o600)
print(f'Backup written to {destination.resolve()}')
