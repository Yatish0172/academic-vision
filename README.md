# Academic Vision — connected attendance application

A React/TypeScript frontend and a local FastAPI backend with SQLite persistence. The app starts with an empty database and a first-run administrator setup screen.

## Run on this computer

Dependencies and the two local ONNX models are installed in this project. From this directory:

```powershell
npm start
```

- Website: http://localhost:3000
- API and interactive documentation: http://127.0.0.1:8001/docs
- Health: http://127.0.0.1:8001/api/health

Create your administrator account in the browser. There are no default credentials. `npm start` starts both processes; Ctrl+C stops them. Port 8001 avoids the existing application's service on port 8000.

## Fresh installation

Requires Node.js 20.19+ or 22.12+, Python 3.11–3.13, and a camera for webcam capture.

```powershell
powershell -ExecutionPolicy Bypass -File scripts/setup.ps1
# If the Python launcher is unavailable:
powershell -ExecutionPolicy Bypass -File scripts/setup.ps1 -Python 'C:\Path\To\python.exe'
```

Or install manually:

```powershell
py -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r backend/requirements.txt
npm ci
```

Place these OpenCV models in `models/` (already copied from the existing local project on this computer):

- `face_detection_yunet.onnx` — YuNet face detector with facial landmarks.
- `face_recognition_sface.onnx` — SFace recognition model.

Official references: [OpenCV face detection and recognition](https://docs.opencv.org/4.12.0/d0/dd4/tutorial_dnn_face.html), [YuNet model](https://github.com/opencv/opencv_zoo/tree/main/models/face_detection_yunet), [SFace model](https://github.com/opencv/opencv_zoo/tree/main/models/face_recognition_sface). Preserve the models' upstream license terms when redistributing them.

## Implemented workflow

1. **Students:** register/edit students, including full name and SAP ID. SAP IDs are editable, unique when provided, and preserve leading zeroes. Administrators can also edit Student ID; the change atomically updates enrollment, rosters, attendance, and review references, and records both IDs in the audit log. Changing identifiers does not require re-enrollment. Recognized face labels show the full name and SAP ID on separate lines. Record the reference to their consent before biometric enrollment. Deactivation deletes their template and retains historical attendance.
2. **Enrollment:** upload or capture 3–10 distinct photos. The server checks file type, dimensions, face count, image quality, and embedding consistency. It encrypts the averaged SFace embedding. Source photos are discarded; no image gallery is saved.
3. **Courses and sessions:** create courses and sections, choose roster members, and start a session. Each session takes a permanent roster snapshot. Only one session can be open per section.
4. **Live capture:** starting the camera automatically analyzes frames every 1.5 seconds and draws face boxes on the live video. Recognition preview works without a session, matching active, consenting enrolled students without saving attendance or review records. Selecting an open session limits matching to its roster and enables attendance review. Each request finishes before the next starts; analysis can be paused. Uploaded photos work in either mode.
5. **RTSP:** administrators register named network cameras under Settings. URLs, including credentials, are encrypted. Live Capture can fetch and analyze a current frame. This is bounded snapshot capture, not a continuous video relay. The API host must be able to reach the camera.
6. **Review:** candidate matches are deduplicated while pending. An operator can confirm identity and mark present, reject without changing attendance, or request another capture. No identity is marked present automatically. Poor/ambiguous matches can use manual attendance.
7. **Manual attendance:** record Present, Absent, Late, or Excused with a reason. Changes retain before/after values in the audit log. Closing requires all pending reviews to be resolved and preserves unmarked records as Unmarked.
8. **Reports:** filter by session and export CSV. CSV text is protected against spreadsheet formula injection.
9. **Settings/accounts:** configure inference thresholds and institution name, manage cameras, add administrators/operators/viewers, and deactivate team accounts. Every user can change their password; doing so revokes their other sign-in sessions. Deactivation revokes their sign-in sessions.

Liveness/anti-spoof detection is not implemented. The application explicitly requires operator confirmation. Recognition thresholds need calibration with your actual camera and room. Tests validate data/workflow behavior and model loading; they do not establish recognition accuracy or camera connectivity for your environment.

## Access and data storage

- **ADMIN:** all operations, including students, consent, enrollment, courses, rosters, settings, users, and audit.
- **OPERATOR:** capture, review, sessions, manual attendance, and read access to reports/registry.
- **VIEWER:** read-only dashboard, registry, sessions, settings, and reports.
- Passwords use salted scrypt hashes; cookies are HttpOnly and SameSite=Strict, expire after eight hours, and refer to hashed server-side tokens.
- SQLite foreign keys, WAL, and request-level transactions enforce relationships and serialize writes. Keep this deployment to one Uvicorn worker; the login rate limiter and model lock are process-local.
- `data/attendance.db` holds application data. `data/.embedding.key` encrypts templates and RTSP credentials. Protect the data directory with operating-system permissions. Losing the key makes the stored templates and camera credentials unreadable.
- Runtime data, models, environments, and build output are git-ignored. Prototype components are preserved in the source tree but `src/App.tsx` mounts only the connected application.

## Configuration

Set environment variables in the shell before starting. `.env.example` documents them; the Python service does not implicitly load `.env` files.

| Variable | Default | Purpose |
| --- | --- | --- |
| `FACE_ATTENDANCE_DATA_DIR` | project `data/` | SQLite database and local encryption key |
| `FACE_ATTENDANCE_MODELS_DIR` | project `models/` | ONNX model directory |
| `FACE_ATTENDANCE_KEY` | generated local key file | Optional Fernet encryption key from a secret manager |
| `ALLOWED_HOSTS` | `localhost,127.0.0.1,testserver` | Accepted HTTP hostnames |
| `ALLOWED_ORIGINS` | localhost/127.0.0.1 on 3000 and 8001 | Accepted browser mutation origins |
| `COOKIE_SECURE` | `false` | Set `true` when served over HTTPS |
| `PYTHON_EXE` | project `.venv` interpreter | Optional Python override for npm scripts |

For remote deployment, complete initial setup locally, terminate HTTPS in a reverse proxy, set explicit allowed hosts/origins and `COOKIE_SECURE=true`, protect the data/key files and backups, and set an upload limit of 82 MB or less at the proxy. No cloud deployment, institutional SIS integration, distributed edge-node synchronization, or certified anti-spoof system is included.

## Build and validate

```powershell
npm run build
npm run test:backend
npm run test:browser
```

The browser test uses its own temporary database and ports 3011/8011. On Windows it uses installed Microsoft Edge; on other systems install Playwright Chromium with `npx playwright install chromium`.

The backend suite uses isolated temporary databases. It covers permissions, session expiry/revocation, request-origin protection, rate limits, uniqueness/concurrency, roster snapshots, consent purging, encryption, review deduplication, image validation, CSV output, RTSP configuration, and actual ONNX model loading on a blank image. Recognition workflow fixtures use controlled embeddings; actual students' photos are never loaded by tests.

Serve the production build from the API process:

```powershell
npm run build
.\.venv\Scripts\python.exe -m uvicorn backend.main:app --host 127.0.0.1 --port 8001
```

Then open http://127.0.0.1:8001. For development, use `npm start`.

## Backup and restore

```powershell
.\.venv\Scripts\python.exe scripts/backup.py D:\Backups\AcademicVision
```

This uses SQLite's online backup API and copies the local encryption key into a new timestamped folder. Protect backups as you protect the live database. If `FACE_ATTENDANCE_KEY` is supplied externally, back it up separately. To restore, stop the application, set `FACE_ATTENDANCE_DATA_DIR` to the chosen backup folder, restore the matching encryption key or environment secret, and restart.

## API

Interactive schema: `/docs` (click **Authorize** and enter `AcademicVision` for the request header); machine-readable schema: `/openapi.json`. Browser mutations must include `X-Requested-With: AcademicVision`, and requests use the sign-in cookie. External clients must retain that cookie too. No CORS access is enabled; the Vite development proxy or API-hosted frontend keeps requests on the same origin.

| Area | Endpoints |
| --- | --- |
| Setup/auth | `GET /api/health`, `POST /api/setup`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`, `POST /api/auth/password` |
| Users | `GET/POST /api/users`, `DELETE /api/users/{id}` |
| Students | `GET/POST /api/students`, `PUT/DELETE /api/students/{id}`, `PATCH /api/students/{id}/consent` |
| Enrollment | `POST /api/students/{id}/enrollment` (multipart `photos`) |
| Courses | `GET/POST /api/courses`, `POST /api/sections`, `GET/PUT /api/sections/{id}/roster` |
| Attendance | `GET /api/sessions`, `POST /api/sections/{id}/sessions`, `GET /api/sessions/{id}/roster`, `PATCH /api/sessions/{id}/attendance`, `POST /api/sessions/{id}/close` |
| Vision | `POST /api/vision/analyze` (multipart `frame`, `session_id` optional for preview) |
| Network cameras | `GET/POST /api/cameras`, `DELETE /api/cameras/{id}`, `POST /api/cameras/{id}/analyze` |
| Review | `GET /api/reviews`, `PATCH /api/reviews/{id}` |
| Reporting/config | `GET /api/dashboard`, `GET /api/reports`, `GET /api/reports/export`, `GET/PUT /api/settings`, `GET /api/audit` |


## Motion and activity monitoring

In **Live Capture**, start the webcam and enable **Motion monitoring**. Select the whole view or its left/right half, adjust the percentage of moving area, and choose how long movement must persist before an alert. An amber box indicates the changed region. The activity list supports manual review and clearing, with a 10-second repeat limit and a maximum of 50 events.

This is browser-local frame differencing at 5 samples/second, with noise filtering and uniform exposure compensation. It runs independently of face models and attendance sessions. Alerts cover sustained high movement and movement within a selected area; they are not a trained abnormal-behavior, intrusion, fall, or misconduct classifier. Camera movement, shadows, and nonuniform lighting can cause false positives. Use a fixed camera and check alerts visually. Events are temporary and disappear when leaving Live Capture or refreshing; no video or event records are uploaded or saved. Uploaded stills and RTSP snapshots do not support this motion monitor.
