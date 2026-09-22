import React, { useEffect, useRef, useState } from "react";
import {
  api,
  downloadReport,
  type Analysis,
  type Attendance,
  type Audit,
  type Course,
  type Dashboard,
  type Health,
  type Review,
  type Section,
  type Session,
  type Settings,
  type StudentRecord,
  type User,
} from "../api";
import { NavigationTab } from "../types";
import { CameraManagement, NetworkCapture } from "./NetworkCameras";
import { AccountSecurity } from "./AccountSecurity";
import { FaceLabel } from "./FaceLabel";
import { MotionMonitor } from "./MotionMonitor";
import {
  Camera,
  Download,
  Plus,
  RefreshCw,
  ScanFace,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";

const message = (error: unknown) =>
  error instanceof Error ? error.message : "The request failed. Please retry.";
const date = (value?: string) =>
  value ? new Date(value).toLocaleString() : "—";
const emptyStudent = {
  sap_id: "",
  id: "",
  name: "",
  email: "",
  programme: "",
  semester: 1,
  section: "1",
};
type StudentForm = typeof emptyStudent;
type Notify = (text: string) => void;
type Run = (action: () => Promise<void>) => Promise<void>;

function useResource<T>(path: string, initial: T, version = 0) {
  const [data, setData] = useState<T>(initial);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    api<T>(path, "GET", undefined, controller.signal)
      .then(setData)
      .catch((e) => {
        if (!controller.signal.aborted) setError(message(e));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [path, version]);
  return { data, error, loading };
}

function Badge({ children }: { children: React.ReactNode }) {
  return <span className="status-badge">{children}</span>;
}
function Empty({ children }: { children: React.ReactNode }) {
  return <div className="empty-state">{children}</div>;
}
function ErrorNotice({ error }: { error: string }) {
  return error ? (
    <p role="alert" className="error-notice">
      {error}
    </p>
  ) : null;
}
function Modal({
  title,
  children,
  close,
}: {
  title: string;
  children: React.ReactNode;
  close: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement;
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
      if (event.key === "Tab") {
        const elements = Array.from(
          ref.current?.querySelectorAll<HTMLElement>(
            "button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),a[href]",
          ) || [],
        );
        const first = elements[0] as HTMLElement | undefined,
          last = elements[elements.length - 1] as HTMLElement | undefined;
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    };
    ref.current?.focus();
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("keydown", key);
      previous?.focus();
    };
  }, []);
  return (
    <div className="modal-backdrop">
      <div
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        ref={ref}
        tabIndex={-1}
      >
        <div className="panel-heading">
          <h2>{title}</h2>
          <button type="button" aria-label="Close dialog" onClick={close}>
            <X size={19} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Login({
  health,
  onLogin,
}: {
  health: Health;
  onLogin: (user: User) => void;
}) {
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      onLogin(
        await api<User>(
          health.setup_required ? "/setup" : "/auth/login",
          "POST",
          health.setup_required
            ? { username, name, password }
            : { username, password },
        ),
      );
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="login-page">
      <form className="login-card" onSubmit={submit}>
        <div className="brand-icon">
          <ScanFace size={30} />
        </div>
        <p className="eyebrow">FACE ATTENDANCE · ACADEMIC VISION</p>
        <h1>
          {health.setup_required ? "Set up your institution" : "Welcome back"}
        </h1>
        <p className="muted">
          {health.setup_required
            ? "Create the first administrator account to start managing attendance."
            : "Sign in to your attendance workspace."}
        </p>
        <ErrorNotice error={error} />
        {health.setup_required && (
          <label>
            Your name
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              maxLength={120}
            />
          </label>
        )}
        <label>
          Username
          <input
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            maxLength={60}
          />
        </label>
        <label>
          Password
          <input
            required
            type="password"
            minLength={health.setup_required ? 12 : 1}
            maxLength={256}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={
              health.setup_required ? "new-password" : "current-password"
            }
          />
        </label>
        {health.setup_required && (
          <p className="muted">Use at least 12 characters.</p>
        )}
        <button className="primary" disabled={busy}>
          {busy
            ? "Please wait…"
            : health.setup_required
              ? "Create administrator"
              : "Sign in"}
        </button>
      </form>
    </div>
  );
}

export function ConnectedWorkspace({
  tab,
  user,
  health,
  version,
  refresh,
  notify,
  onNavigate,
  onReviewCount,
}: {
  tab: NavigationTab;
  user: User;
  health: Health;
  version: number;
  refresh: () => void;
  notify: Notify;
  onNavigate: (tab: NavigationTab) => void;
  onReviewCount: (n: number) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const running = useRef(false);
  const run: Run = async (action) => {
    if (running.current) return;
    running.current = true;
    setBusy(true);
    setError("");
    try {
      await action();
      refresh();
    } catch (e) {
      setError(message(e));
    } finally {
      running.current = false;
      setBusy(false);
    }
  };
  useEffect(() => setError(""), [tab]);
  const props = { user, version, run, busy, notify };
  return (
    <section className="workspace">
      <ErrorNotice error={error} />
      <div className="workspace-tools">
        <span className="eyebrow">
          ACADEMIC VISION / {tab.replaceAll("-", " ")}
        </span>
        <button onClick={refresh} disabled={busy}>
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>
      {tab === "dashboard" && (
        <DashboardPanel
          {...props}
          health={health}
          onNavigate={onNavigate}
          onReviewCount={onReviewCount}
        />
      )}
      {(tab === "students" || tab === "enrollment") && (
        <StudentsPanel {...props} enrollmentOnly={tab === "enrollment"} />
      )}
      {tab === "attendance-sessions" && <SessionsPanel {...props} />}
      {tab === "review-queue" && (
        <ReviewsPanel {...props} onReviewCount={onReviewCount} />
      )}
      {tab === "live-capture" && <CapturePanel {...props} health={health} />}
      {tab === "reports" && <ReportsPanel {...props} />}
      {tab === "settings" && <SettingsPanel {...props} />}
    </section>
  );
}
type PanelProps = {
  user: User;
  version: number;
  run: Run;
  busy: boolean;
  notify: Notify;
};

function DashboardPanel({
  version,
  health,
  onNavigate,
  onReviewCount,
}: PanelProps & {
  health: Health;
  onNavigate: (tab: NavigationTab) => void;
  onReviewCount: (n: number) => void;
}) {
  const stats = useResource<Dashboard | null>("/dashboard", null, version);
  const sessions = useResource<Session[]>("/sessions", [], version);
  useEffect(() => {
    if (stats.data) onReviewCount(stats.data.pending_reviews);
  }, [stats.data]);
  return (
    <>
      <h1>Attendance overview</h1>
      <p className="muted">
        Live records from your institution’s attendance database.
      </p>
      <ErrorNotice error={stats.error || sessions.error} />
      <div className="stat-grid">
        {[
          ["Active students", stats.data?.students],
          ["Enrolled faces", stats.data?.enrolled],
          ["Open sessions", stats.data?.open_sessions],
          ["Pending review", stats.data?.pending_reviews],
        ].map(([label, value]) => (
          <div className="stat-card" key={label}>
            <p>{label}</p>
            <strong>{value ?? "—"}</strong>
          </div>
        ))}
      </div>
      <div className="panel">
        <div className="panel-heading">
          <h2>Start an attendance workflow</h2>
          <ShieldCheck size={20} />
        </div>
        <div className="action-grid">
          <button onClick={() => onNavigate("students")}>
            <Users />
            Register students
          </button>
          <button onClick={() => onNavigate("attendance-sessions")}>
            <Plus />
            Manage courses & sessions
          </button>
          <button onClick={() => onNavigate("live-capture")}>
            <Camera />
            Open live capture
          </button>
        </div>
      </div>
      <div className="panel">
        <h2>Recognition engine</h2>
        <p>
          {health.vision.model} ·{" "}
          <Badge>
            {health.vision.ready ? "Models available" : "Models required"}
          </Badge>
        </p>
        {!health.vision.ready && (
          <p className="muted">
            Missing: {health.vision.missing.join(", ")}. Manual attendance is
            available.
          </p>
        )}
        <p className="muted">
          Candidate matches require operator confirmation. Source photos are
          processed locally and discarded after enrollment or analysis.
        </p>
      </div>
      <div className="panel">
        <h2>Recent sessions</h2>
        {sessions.data.length === 0 ? (
          <Empty>
            No sessions yet. Create a course, section, and roster to begin.
          </Empty>
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Course</th>
                  <th>Section</th>
                  <th>Started</th>
                  <th>Present / roster</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {sessions.data.slice(0, 8).map((s) => (
                  <tr key={s.id}>
                    <td>
                      {s.code} · {s.course}
                    </td>
                    <td>{s.section}</td>
                    <td>{date(s.started_at)}</td>
                    <td>
                      {s.present} / {s.total}
                    </td>
                    <td>
                      <Badge>{s.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

function StudentsPanel({
  user,
  version,
  run,
  busy,
  notify,
  enrollmentOnly,
}: PanelProps & { enrollmentOnly: boolean }) {
  const students = useResource<StudentRecord[]>("/students", [], version);
  const [query, setQuery] = useState("");
  const [edit, setEdit] = useState<StudentForm | null>(null);
  const [editing, setEditing] = useState(false);
  const [originalId, setOriginalId] = useState("");
  const [consent, setConsent] = useState<StudentRecord | null>(null);
  const [consentStatus, setConsentStatus] = useState("RECORDED");
  const [reason, setReason] = useState("");
  const [enroll, setEnroll] = useState<StudentRecord | null>(null);
  const [deactivate, setDeactivate] = useState<StudentRecord | null>(null);
  const admin = user.role === "ADMIN";
  const filtered = students.data.filter((s) =>
    `${s.id} ${s.sap_id || ""} ${s.name} ${s.email} ${s.programme}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  function openEdit(student?: StudentRecord) {
    setEditing(!!student);
    setOriginalId(student?.id || "");
    setEdit(
      student
        ? {
            sap_id: student.sap_id || "",
            id: student.id,
            name: student.name,
            email: student.email,
            programme: student.programme,
            semester: student.semester,
            section: student.section,
          }
        : { ...emptyStudent },
    );
  }
  return (
    <>
      <div className="panel-heading">
        <div>
          <h1>
            {enrollmentOnly ? "Biometric enrollment" : "Student registry"}
          </h1>
          <p className="muted">
            {enrollmentOnly
              ? "Record consent, then upload clear photos or capture them with your camera."
              : "Manage student profiles, consent, and face templates."}
          </p>
        </div>
        {admin && (
          <button className="primary" onClick={() => openEdit()}>
            <Plus size={16} />
            Add student
          </button>
        )}
      </div>
      <ErrorNotice error={students.error} />
      <input
        className="search-input"
        aria-label="Search students"
        placeholder="Search name, ID, email, or programme…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <div className="panel table-scroll">
        <table>
          <thead>
            <tr>
              <th>Student</th>
              <th>Programme</th>
              <th>Consent</th>
              <th>Face template</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => (
              <tr key={s.id}>
                <td>
                  <strong>{s.name}</strong>
                  <small>Student ID: {s.id}</small>
                  <small>
                    {s.sap_id ? "SAP ID: " + s.sap_id : "SAP ID not set"} ·{" "}
                    {s.email}
                  </small>
                </td>
                <td>
                  {s.programme}
                  <small>
                    Semester {s.semester} · Section {s.section}
                  </small>
                </td>
                <td>
                  <Badge>{s.consent.replaceAll("_", " ")}</Badge>
                </td>
                <td>
                  {s.template}
                  <small>
                    {s.samples
                      ? `${s.samples} samples · ${date(s.enrolled_at)}`
                      : "No template stored"}
                  </small>
                </td>
                <td>{s.status}</td>
                <td>
                  <div className="row-actions">
                    {admin && s.status === "Active" && (
                      <>
                        <button onClick={() => openEdit(s)}>Edit</button>
                        <button
                          onClick={() => {
                            setConsent(s);
                            setConsentStatus(s.consent);
                            setReason("");
                          }}
                        >
                          Consent
                        </button>
                        <button
                          disabled={s.consent !== "RECORDED"}
                          onClick={() => setEnroll(s)}
                        >
                          Enroll
                        </button>
                        <button
                          className="danger-text"
                          onClick={() => setDeactivate(s)}
                        >
                          Deactivate
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!filtered.length && (
          <Empty>
            {students.loading
              ? "Loading students…"
              : "No students found. Add your first student to get started."}
          </Empty>
        )}
      </div>
      {edit && (
        <Modal
          title={editing ? "Edit student" : "Add student"}
          close={() => setEdit(null)}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void run(async () => {
                await api(
                  editing
                    ? "/students/" + encodeURIComponent(originalId)
                    : "/students",
                  editing ? "PUT" : "POST",
                  edit,
                );
                setEdit(null);
                notify("Student saved.");
              });
            }}
          >
            <div className="form-grid">
              {(
                [
                  "id",
                  "name",
                  "sap_id",
                  "email",
                  "programme",
                  "section",
                ] as const
              ).map((key) => (
                <label key={key}>
                  {key === "id"
                    ? "Student ID"
                    : key === "name"
                      ? "Full name"
                      : key === "sap_id"
                        ? "SAP ID"
                        : key[0].toUpperCase() + key.slice(1)}
                  <input
                    type={key === "email" ? "email" : "text"}
                    required={
                      key !== "email" && key !== "programme" && key !== "sap_id"
                    }
                    value={edit[key]}
                    onChange={(e) =>
                      setEdit({ ...edit, [key]: e.target.value })
                    }
                  />
                </label>
              ))}
              <label>
                Semester
                <input
                  type="number"
                  min={1}
                  max={20}
                  required
                  value={edit.semester}
                  onChange={(e) =>
                    setEdit({ ...edit, semester: Number(e.target.value) })
                  }
                />
              </label>
            </div>
            <p className="muted">
              {editing
                ? "Changing Student ID preserves enrollment, rosters, and attendance history."
                : "New students start without biometric consent or a face template."}
            </p>
            <button className="primary" disabled={busy}>
              Save student
            </button>
          </form>
        </Modal>
      )}
      {consent && (
        <Modal
          title={"Consent · " + consent.name}
          close={() => setConsent(null)}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void run(async () => {
                await api("/students/" + consent.id + "/consent", "PATCH", {
                  consent: consentStatus,
                  reason,
                });
                setConsent(null);
                notify(
                  "Consent saved. Templates are purged when consent is withdrawn.",
                );
              });
            }}
          >
            <label>
              Consent status
              <select
                value={consentStatus}
                onChange={(e) => setConsentStatus(e.target.value)}
              >
                <option value="RECORDED">Consent recorded</option>
                <option value="NOT_RECORDED">Not recorded</option>
                <option value="WITHDRAWN">Withdrawn</option>
              </select>
            </label>
            <label>
              Record reference or reason
              <textarea
                required
                minLength={3}
                maxLength={500}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Signed enrollment form dated…"
              />
            </label>
            <p className="muted">
              Withdrawing consent deletes the stored face template. Manual
              attendance remains available.
            </p>
            <button className="primary" disabled={busy}>
              Save consent
            </button>
          </form>
        </Modal>
      )}
      {deactivate && (
        <Modal
          title={"Deactivate " + deactivate.name + "?"}
          close={() => setDeactivate(null)}
        >
          <p>
            The face template will be deleted and biometric consent withdrawn.
            Historical attendance remains available.
          </p>
          <button
            className="danger"
            disabled={busy}
            onClick={() =>
              void run(async () => {
                await api("/students/" + deactivate.id, "DELETE");
                setDeactivate(null);
                notify("Student deactivated and face template deleted.");
              })
            }
          >
            Deactivate student
          </button>
        </Modal>
      )}
      {enroll && (
        <Enrollment
          student={enroll}
          close={() => setEnroll(null)}
          run={run}
          busy={busy}
          notify={notify}
        />
      )}
    </>
  );
}

function useCamera() {
  const video = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const generation = useRef(0);
  const [active, setActive] = useState(false);
  const stop = () => {
    generation.current++;
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
    setActive(false);
  };
  useEffect(
    () => () => {
      generation.current++;
      stream.current?.getTracks().forEach((t) => t.stop());
    },
    [],
  );
  async function start() {
    if (!navigator.mediaDevices?.getUserMedia)
      throw new Error(
        "Camera access requires localhost or HTTPS and a supported browser.",
      );
    stop();
    const current = generation.current;
    const media = await navigator.mediaDevices.getUserMedia({
      video: { width: { ideal: 1280 }, height: { ideal: 720 } },
      audio: false,
    });
    if (current !== generation.current) {
      media.getTracks().forEach((t) => t.stop());
      return;
    }
    stream.current = media;
    if (video.current) {
      video.current.srcObject = media;
      await video.current.play();
    }
    setActive(true);
  }
  async function capture() {
    const el = video.current;
    if (!el?.videoWidth)
      throw new Error("Start the camera and wait for the preview.");
    const canvas = document.createElement("canvas");
    canvas.width = el.videoWidth;
    canvas.height = el.videoHeight;
    canvas.getContext("2d")!.drawImage(el, 0, 0);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.9),
    );
    if (!blob) throw new Error("Could not capture this frame.");
    return new File([blob], "camera-" + Date.now() + ".jpg", {
      type: "image/jpeg",
    });
  }
  return { video, active, start, stop, capture };
}

function Enrollment({
  student,
  close,
  run,
  busy,
  notify,
}: {
  student: StudentRecord;
  close: () => void;
  run: Run;
  busy: boolean;
  notify: Notify;
}) {
  const [photos, setPhotos] = useState<File[]>([]);
  const camera = useCamera();
  return (
    <Modal title={"Enroll · " + student.name} close={close}>
      <p className="muted">
        Provide 3–10 distinct photos of this student. Keep the face visible
        and well lit. The server checks image quality and consistency.
      </p>
      <video
        className="camera-preview"
        ref={camera.video}
        autoPlay
        muted
        playsInline
      />
      <div className="row-actions">
        <button disabled={busy} onClick={() => void run(camera.start)}>
          Start camera
        </button>
        <button
          disabled={!camera.active || busy || photos.length >= 10}
          onClick={() =>
            void run(async () => {
              const photo = await camera.capture();
              setPhotos((p) => [...p, photo]);
            })
          }
        >
          Capture photo
        </button>
        <button onClick={camera.stop}>Stop camera</button>
      </div>
      <label>
        Or choose JPEG / PNG photos
        <input
          type="file"
          accept="image/jpeg,image/png"
          multiple
          onChange={(e) =>
            setPhotos((p) =>
              [...p, ...Array.from(e.target.files || [])].slice(0, 10),
            )
          }
        />
      </label>
      <p>{photos.length} / 10 photos selected</p>
      <ul className="photo-list">
        {photos.map((photo, i) => (
          <li key={i}>
            {photo.name} ({Math.round(photo.size / 1024)} KB)
            <button
              aria-label={"Remove photo " + (i + 1)}
              onClick={() => setPhotos((p) => p.filter((_, j) => j !== i))}
            >
              Remove
            </button>
          </li>
        ))}
      </ul>
      <button
        className="primary"
        disabled={busy || photos.length < 3}
        onClick={() =>
          void run(async () => {
            const form = new FormData();
            photos.forEach((photo) => form.append("photos", photo));
            await api("/students/" + student.id + "/enrollment", "POST", form);
            camera.stop();
            close();
            notify(
              "Face template encrypted and saved. Source photos discarded.",
            );
          })
        }
      >
        {busy ? "Processing…" : "Validate & save face template"}
      </button>
    </Modal>
  );
}

function SessionsPanel({ user, version, run, busy, notify }: PanelProps) {
  const courses = useResource<{ courses: Course[]; sections: Section[] }>(
    "/courses",
    { courses: [], sections: [] },
    version,
  );
  const sessions = useResource<Session[]>("/sessions", [], version);
  const [courseForm, setCourseForm] = useState({
    code: "",
    name: "",
    term: "",
  });
  const [sectionForm, setSectionForm] = useState({
    course_id: "",
    name: "",
    room: "",
  });
  const [rosterSection, setRosterSection] = useState<Section | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const admin = user.role === "ADMIN";
  return (
    <>
      <div className="panel-heading">
        <div>
          <h1>Courses & attendance sessions</h1>
          <p className="muted">
            Create a course, add a section roster, then start a session.
          </p>
        </div>
        <button onClick={() => void run(() => downloadReport())}>
          <Download size={15} />
          Export CSV
        </button>
      </div>
      <ErrorNotice error={courses.error || sessions.error} />
      {admin && (
        <details className="panel">
          <summary>Add courses and sections</summary>
          <div className="two-columns">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void run(async () => {
                  await api("/courses", "POST", courseForm);
                  setCourseForm({ code: "", name: "", term: "" });
                  notify("Course created.");
                });
              }}
            >
              <h2>New course</h2>
              {(["code", "name", "term"] as const).map((key) => (
                <label key={key}>
                  {key[0].toUpperCase() + key.slice(1)}
                  <input
                    required={key !== "term"}
                    value={courseForm[key]}
                    onChange={(e) =>
                      setCourseForm({ ...courseForm, [key]: e.target.value })
                    }
                  />
                </label>
              ))}
              <button className="primary" disabled={busy}>
                Create course
              </button>
            </form>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void run(async () => {
                  await api("/sections", "POST", {
                    ...sectionForm,
                    course_id: Number(sectionForm.course_id),
                  });
                  setSectionForm({ course_id: "", name: "", room: "" });
                  notify("Section created. Add its roster next.");
                });
              }}
            >
              <h2>New section</h2>
              <label>
                Course
                <select
                  required
                  value={sectionForm.course_id}
                  onChange={(e) =>
                    setSectionForm({
                      ...sectionForm,
                      course_id: e.target.value,
                    })
                  }
                >
                  <option value="">Select a course</option>
                  {courses.data.courses.map((c) => (
                    <option value={c.id} key={c.id}>
                      {c.code} · {c.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Section name
                <input
                  required
                  value={sectionForm.name}
                  onChange={(e) =>
                    setSectionForm({ ...sectionForm, name: e.target.value })
                  }
                />
              </label>
              <label>
                Room
                <input
                  value={sectionForm.room}
                  onChange={(e) =>
                    setSectionForm({ ...sectionForm, room: e.target.value })
                  }
                />
              </label>
              <button className="primary" disabled={busy}>
                Create section
              </button>
            </form>
          </div>
        </details>
      )}
      <div className="panel">
        <h2>Course sections</h2>
        {!courses.data.sections.length ? (
          <Empty>No sections yet.</Empty>
        ) : (
          <div className="section-grid">
            {courses.data.sections.map((s) => (
              <article className="section-card" key={s.id}>
                <Badge>{s.code}</Badge>
                <h3>{s.course_name}</h3>
                <p>
                  Section {s.name} · {s.room || "Room not set"}
                </p>
                <p className="muted">{s.roster_count} roster members</p>
                <div className="row-actions">
                  {admin && (
                    <button onClick={() => setRosterSection(s)}>
                      Edit roster
                    </button>
                  )}
                  {user.role !== "VIEWER" && (
                    <button
                      className="primary"
                      disabled={
                        busy ||
                        sessions.data.some(
                          (a) => a.section_id === s.id && a.status === "OPEN",
                        )
                      }
                      onClick={() =>
                        void run(async () => {
                          await api("/sections/" + s.id + "/sessions", "POST");
                          notify(
                            "Session started. The roster has been saved for this session.",
                          );
                        })
                      }
                    >
                      Start session
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
      <div className="panel table-scroll">
        <h2>Sessions</h2>
        <table>
          <thead>
            <tr>
              <th>Course / section</th>
              <th>Started</th>
              <th>Present / roster</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sessions.data.map((s) => (
              <tr key={s.id}>
                <td>
                  {s.code} · {s.section}
                  <small>{s.room}</small>
                </td>
                <td>{date(s.started_at)}</td>
                <td>
                  {s.present} / {s.total}
                </td>
                <td>
                  <Badge>{s.status}</Badge>
                </td>
                <td>
                  <button onClick={() => setSession(s)}>View attendance</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!sessions.data.length && <Empty>No attendance sessions yet.</Empty>}
      </div>
      {rosterSection && (
        <RosterEditor
          section={rosterSection}
          close={() => setRosterSection(null)}
          version={version}
          run={run}
          busy={busy}
          notify={notify}
        />
      )}
      {session && (
        <SessionEditor
          session={sessions.data.find((s) => s.id === session.id) || session}
          close={() => setSession(null)}
          user={user}
          version={version}
          run={run}
          busy={busy}
          notify={notify}
        />
      )}
    </>
  );
}

function RosterEditor({
  section,
  close,
  version,
  run,
  busy,
  notify,
}: {
  section: Section;
  close: () => void;
  version: number;
  run: Run;
  busy: boolean;
  notify: Notify;
}) {
  const students = useResource<StudentRecord[]>("/students", [], version);
  const roster = useResource<StudentRecord[]>(
    "/sections/" + section.id + "/roster",
    [],
    version,
  );
  const [ids, setIds] = useState<string[]>([]);
  useEffect(() => setIds(roster.data.map((s) => s.id)), [roster.data]);
  return (
    <Modal
      title={"Roster · " + section.code + " / " + section.name}
      close={close}
    >
      <ErrorNotice error={students.error || roster.error} />
      <p className="muted">
        Changes apply to future sessions. Existing session rosters remain
        unchanged.
      </p>
      <div className="check-list">
        {students.data
          .filter((s) => s.status === "Active")
          .map((s) => (
            <label key={s.id}>
              <input
                type="checkbox"
                checked={ids.includes(s.id)}
                onChange={(e) =>
                  setIds((p) =>
                    e.target.checked
                      ? [...p, s.id]
                      : p.filter((id) => id !== s.id),
                  )
                }
              />
              {s.name} · {s.id}
            </label>
          ))}
      </div>
      <button
        className="primary"
        disabled={
          busy ||
          students.loading ||
          roster.loading ||
          !!students.error ||
          !!roster.error
        }
        onClick={() =>
          void run(async () => {
            const activeIds = new Set(
              students.data
                .filter((s) => s.status === "Active")
                .map((s) => s.id),
            );
            await api("/sections/" + section.id + "/roster", "PUT", {
              student_ids: ids.filter((id) => activeIds.has(id)),
            });
            close();
            notify("Roster saved.");
          })
        }
      >
        Save roster ({ids.length})
      </button>
    </Modal>
  );
}

function SessionEditor({
  session,
  close,
  user,
  version,
  run,
  busy,
  notify,
}: PanelProps & { session: Session; close: () => void }) {
  const roster = useResource<Attendance[]>(
    "/sessions/" + session.id + "/roster",
    [],
    version,
  );
  const [studentId, setStudentId] = useState("");
  const [status, setStatus] = useState("Present");
  const [reason, setReason] = useState("");
  return (
    <Modal
      title={session.code + " · Section " + session.section}
      close={close}
    >
      <ErrorNotice error={roster.error} />
      <div className="panel-heading">
        <Badge>{session.status}</Badge>
        <button onClick={() => void run(() => downloadReport(session.id))}>
          <Download size={14} />
          Export session
        </button>
      </div>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Student</th>
              <th>Status</th>
              <th>Method</th>
              <th>Reason</th>
            </tr>
          </thead>
          <tbody>
            {roster.data.map((a) => (
              <tr key={a.student_id}>
                <td>
                  {a.student_name}
                  <small>{a.student_id}</small>
                </td>
                <td>
                  <Badge>{a.status}</Badge>
                </td>
                <td>{a.method || "—"}</td>
                <td>{a.reason || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {session.status === "OPEN" && user.role !== "VIEWER" && (
        <>
          <form
            className="panel"
            onSubmit={(e) => {
              e.preventDefault();
              void run(async () => {
                await api("/sessions/" + session.id + "/attendance", "PATCH", {
                  student_id: studentId,
                  status,
                  reason,
                });
                setReason("");
                notify("Attendance saved.");
              });
            }}
          >
            <h3>Record or correct attendance</h3>
            <div className="form-grid">
              <label>
                Student
                <select
                  required
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                >
                  <option value="">Select a student</option>
                  {roster.data
                    .filter((a) => a.student_status === "Active")
                    .map((a) => (
                      <option key={a.student_id} value={a.student_id}>
                        {a.student_name} · {a.student_id}
                      </option>
                    ))}
                </select>
              </label>
              <label>
                Status
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  {["Present", "Absent", "Late", "Excused"].map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </label>
            </div>
            <label>
              Reason
              <input
                required
                minLength={3}
                maxLength={500}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Verified in classroom"
              />
            </label>
            <button className="primary" disabled={busy}>
              Save attendance
            </button>
          </form>
          <p className="muted">
            Closing locks this session. Unmarked students remain unmarked;
            pending reviews must be resolved first.
          </p>
          <button
            className="danger"
            disabled={busy}
            onClick={() =>
              void run(async () => {
                await api("/sessions/" + session.id + "/close", "POST");
                notify("Attendance session closed.");
              })
            }
          >
            Close session
          </button>
        </>
      )}
    </Modal>
  );
}

function ReviewsPanel({
  user,
  version,
  run,
  busy,
  notify,
  onReviewCount,
}: PanelProps & { onReviewCount: (n: number) => void }) {
  const reviews = useResource<Review[]>("/reviews", [], version);
  const [showAll, setShowAll] = useState(false);
  const [selected, setSelected] = useState<Review | null>(null);
  const [decision, setDecision] = useState("confirmed");
  const [reason, setReason] = useState("");
  const pending = reviews.data.filter((r) => r.status === "pending");
  useEffect(() => onReviewCount(pending.length), [reviews.data]);
  return (
    <>
      <h1>Recognition review queue</h1>
      <p className="muted">
        Verify candidate matches against the live classroom view. Rejecting a
        match leaves attendance unchanged.
      </p>
      <ErrorNotice error={reviews.error} />
      <label className="inline-label">
        <input
          type="checkbox"
          checked={showAll}
          onChange={(e) => setShowAll(e.target.checked)}
        />
        Include resolved items
      </label>
      <div className="panel table-scroll">
        <table>
          <thead>
            <tr>
              <th>Candidate</th>
              <th>Similarity</th>
              <th>Observed</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {(showAll ? reviews.data : pending).map((r) => (
              <tr key={r.id}>
                <td>
                  {r.student_name || "Unmatched"}
                  <small>{r.student_id}</small>
                </td>
                <td>
                  {r.score?.toFixed(3) ?? "—"}
                  <small>Margin: {r.margin?.toFixed(3) ?? "—"}</small>
                </td>
                <td>{date(r.created_at)}</td>
                <td>
                  <Badge>{r.status}</Badge>
                </td>
                <td>
                  {r.status === "pending" && user.role !== "VIEWER" && (
                    <button
                      onClick={() => {
                        setSelected(r);
                        setReason("");
                        setDecision("confirmed");
                      }}
                    >
                      Review
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!(showAll ? reviews.data : pending).length && (
          <Empty>No {showAll ? "" : "pending "}review items.</Empty>
        )}
      </div>
      {selected && (
        <Modal
          title={"Review · " + selected.student_name}
          close={() => setSelected(null)}
        >
          <p>{selected.reason}</p>
          <p className="muted">
            Similarity is a model score, not a probability of identity. Confirm
            only after you have verified the student.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void run(async () => {
                await api("/reviews/" + selected.id, "PATCH", {
                  status: decision,
                  reason,
                });
                setSelected(null);
                notify("Review decision saved.");
              });
            }}
          >
            <label>
              Decision
              <select
                value={decision}
                onChange={(e) => setDecision(e.target.value)}
              >
                <option value="confirmed">
                  Confirm identity and mark present
                </option>
                <option value="rejected">
                  Reject match; leave attendance unchanged
                </option>
                <option value="rescan">Request a new capture</option>
              </select>
            </label>
            <label>
              Reason
              <textarea
                minLength={3}
                maxLength={500}
                required
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </label>
            <button className="primary" disabled={busy}>
              Save decision
            </button>
          </form>
        </Modal>
      )}
    </>
  );
}

function CapturePanel({
  user,
  version,
  run,
  busy,
  health,
  notify,
}: PanelProps & { health: Health }) {
  const sessions = useResource<Session[]>("/sessions", [], version);
  const [sessionId, setSessionId] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [result, setResult] = useState<Analysis | null>(null);
  const [preview, setPreview] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [resultSource, setResultSource] = useState<"camera" | "upload">(
    "camera",
  );
  const [continuous, setContinuous] = useState(false);
  const [captureError, setCaptureError] = useState("");
  const camera = useCamera();
  const inFlight = useRef(false);
  const abort = useRef<AbortController | null>(null);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      abort.current?.abort();
    };
  }, []);
  useEffect(() => {
    if (!photo) {
      setPreview("");
      return;
    }
    const url = URL.createObjectURL(photo);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);
  useEffect(() => {
    abort.current?.abort();
    setResult(null);
    setPhoto(null);
  }, [sessionId]);
  useEffect(() => {
    if (
      sessionId &&
      sessions.data.length &&
      !sessions.data.some((s) => s.id === sessionId && s.status === "OPEN")
    ) {
      setContinuous(false);
      camera.stop();
      setSessionId("");
    }
  }, [sessions.data]);
  async function analyze(file: File, source: "camera" | "upload" = "camera") {
    if (inFlight.current) return;
    inFlight.current = true;
    setAnalyzing(true);
    setCaptureError("");
    const controller = new AbortController();
    abort.current = controller;
    try {
      const form = new FormData();
      form.append("frame", file);
      if (sessionId) form.append("session_id", sessionId);
      const response = await api<Analysis>(
        "/vision/analyze",
        "POST",
        form,
        controller.signal,
      );
      if (mounted.current && !controller.signal.aborted) {
        setResultSource(source);
        setPhoto(file);
        setResult(response);
      }
    } finally {
      inFlight.current = false;
      if (mounted.current) setAnalyzing(false);
    }
  }
  useEffect(() => {
    if (!continuous || !camera.active) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    const tick = async () => {
      try {
        await analyze(await camera.capture());
      } catch (e) {
        if (!cancelled) {
          setCaptureError(message(e));
          setContinuous(false);
        }
      }
      if (!cancelled) timer = setTimeout(tick, 1500);
    };
    void tick();
    return () => {
      cancelled = true;
      clearTimeout(timer);
      abort.current?.abort();
    };
  }, [continuous, camera.active, sessionId]);
  return (
    <>
      <h1>Live classroom capture</h1>
      <p className="muted">
        Start the camera to detect faces and preview recognized names. Select an
        attendance session when you want to save attendance.
      </p>
      <ErrorNotice error={sessions.error || captureError} />
      {!health.vision.ready && (
        <ErrorNotice
          error={
            "Install the required models first: " +
            health.vision.missing.join(", ")
          }
        />
      )}
      <div className="panel">
        {!sessionId && (
          <p className="muted">
            Preview mode is active. Face detection and recognition work without
            a course or session; no attendance or review records are saved.
          </p>
        )}
        <label>
          Capture mode
          <select
            value={sessionId}
            onChange={(e) => setSessionId(e.target.value)}
          >
            <option value="">
              Recognition preview — no attendance saved
            </option>
            {sessions.data
              .filter((s) => s.status === "OPEN")
              .map((s) => (
                <option key={s.id} value={s.id}>
                  {s.code} · Section {s.section} · {date(s.started_at)}
                </option>
              ))}
          </select>
        </label>
        <div className="two-columns">
          <div>
            <div
              className="analysis-image live-camera"
              data-testid="live-camera"
            >
              <video
                className="camera-preview"
                ref={camera.video}
                style={{
                  margin: 0,
                  aspectRatio: camera.video.current?.videoWidth
                    ? camera.video.current.videoWidth /
                      camera.video.current.videoHeight
                    : 16 / 9,
                }}
                muted
                autoPlay
                playsInline
              />
              {camera.active &&
                resultSource === "camera" &&
                result?.detections.map((d, index) => (
                  <div
                    key={index}
                    className="face-box"
                    data-testid="live-face-box"
                    style={{
                      left: (100 * d.box[0]) / result.width + "%",
                      top: (100 * d.box[1]) / result.height + "%",
                      width: (100 * d.box[2]) / result.width + "%",
                      height: (100 * d.box[3]) / result.height + "%",
                    }}
                  >
                    <FaceLabel detection={d} fallback={"Face " + (index + 1)} />
                  </div>
                ))}
            </div>
            <p className="muted" role="status" aria-live="polite">
              {analyzing
                ? "Analyzing frame…"
                : result
                  ? `${result.detections.length} face(s) detected · ${result.eligible_students} enrolled student(s) available for matching`
                  : camera.active
                    ? "Camera ready. Waiting for analysis…"
                    : "Start the camera or upload a photo to detect faces."}
            </p>
            <div className="row-actions">
              <button
                disabled={busy || user.role === "VIEWER"}
                onClick={() =>
                  void run(async () => {
                    await camera.start();
                    setResult(null);
                    setCaptureError("");
                    setContinuous(health.vision.ready);
                  })
                }
              >
                Start camera
              </button>
              <button
                onClick={() => {
                  setContinuous(false);
                  camera.stop();
                  abort.current?.abort();
                  setResult(null);
                }}
              >
                Stop camera
              </button>
              <button
                disabled={
                  !camera.active || busy || continuous || !health.vision.ready
                }
                onClick={() =>
                  void run(async () => analyze(await camera.capture()))
                }
              >
                Analyze frame
              </button>
            </div>
            <label className="inline-label">
              <input
                type="checkbox"
                checked={continuous}
                disabled={
                  !camera.active ||
                  !health.vision.ready ||
                  user.role === "VIEWER"
                }
                onChange={(e) => setContinuous(e.target.checked)}
              />
              Analyze camera every 1.5 seconds
            </label>
          </div>
          <div>
            <label>
              Analyze a classroom photo
              <input
                type="file"
                accept="image/png,image/jpeg"
                disabled={
                  busy ||
                  continuous ||
                  user.role === "VIEWER" ||
                  !health.vision.ready
                }
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void run(() => analyze(file, "upload"));
                  e.target.value = "";
                }}
              />
            </label>
            <p className="muted">
              JPEG or PNG, up to 8 MB and 16 megapixels. Preview recognizes
              active, consenting enrolled students. Selecting a session limits
              matching to its roster.
            </p>
            <p className="muted">
              Liveness detection is not implemented. Review identities before
              saving attendance.
            </p>
          </div>
        </div>
      </div>
      <MotionMonitor video={camera.video} active={camera.active} />
      <NetworkCapture
        version={version}
        busy={busy}
        run={run}
        sessionId={sessionId}
        enabled={user.role !== "VIEWER" && health.vision.ready}
      />
      {preview && result && (
        <div className="panel">
          <h2>Analyzed frame</h2>
          <div className="analysis-image">
            <img src={preview} alt="Most recently analyzed classroom frame" />
            {result.detections.map((d, index) => (
              <div
                key={index}
                className="face-box"
                style={{
                  left: (100 * d.box[0]) / result.width + "%",
                  top: (100 * d.box[1]) / result.height + "%",
                  width: (100 * d.box[2]) / result.width + "%",
                  height: (100 * d.box[3]) / result.height + "%",
                }}
              >
                <FaceLabel detection={d} fallback={"Face " + (index + 1)} />
              </div>
            ))}
          </div>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Candidate</th>
                  <th>Score</th>
                  <th>Result</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {result.detections.map((d, i) => (
                  <tr key={i}>
                    <td>
                      {d.name || "Face " + (i + 1)}
                      {d.name && (
                        <small>
                          {d.sap_id ? "SAP ID: " + d.sap_id : "SAP ID not set"}
                        </small>
                      )}
                    </td>
                    <td>{d.score?.toFixed(3) ?? "—"}</td>
                    <td>
                      <Badge>{d.state}</Badge>
                      <small>{d.reason}</small>
                    </td>
                    <td>
                      {d.review_id && user.role !== "VIEWER" && (
                        <button
                          disabled={busy || continuous}
                          onClick={() =>
                            void run(async () => {
                              await api("/reviews/" + d.review_id, "PATCH", {
                                status: "confirmed",
                                reason:
                                  "Operator verified identity against the captured frame.",
                              });
                              setResult((previous) =>
                                previous
                                  ? {
                                      ...previous,
                                      detections: previous.detections.map(
                                        (item, index) =>
                                          index === i
                                            ? {
                                                ...item,
                                                review_id: undefined,
                                                state: "PRESENT",
                                                reason:
                                                  "Operator confirmed attendance.",
                                              }
                                            : item,
                                      ),
                                    }
                                  : null,
                              );
                              notify("Attendance confirmed and saved.");
                            })
                          }
                        >
                          Confirm identity
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!result.detections.length && (
              <Empty>No faces detected. Try a clearer image.</Empty>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function ReportsPanel({ version, run }: PanelProps) {
  const sessions = useResource<Session[]>("/sessions", [], version);
  const [sessionId, setSessionId] = useState("");
  const report = useResource<Attendance[]>(
    "/reports" + (sessionId ? "?session_id=" + sessionId : ""),
    [],
    version,
  );
  return (
    <>
      <div className="panel-heading">
        <div>
          <h1>Attendance reports</h1>
          <p className="muted">
            Saved attendance with status, method, and correction reasons.
          </p>
        </div>
        <button onClick={() => void run(() => downloadReport(sessionId))}>
          <Download size={16} />
          Download CSV
        </button>
      </div>
      <ErrorNotice error={report.error || sessions.error} />
      <label>
        Session
        <select
          value={sessionId}
          onChange={(e) => setSessionId(e.target.value)}
        >
          <option value="">All sessions</option>
          {sessions.data.map((s) => (
            <option key={s.id} value={s.id}>
              {s.code} / {s.section} · {date(s.started_at)}
            </option>
          ))}
        </select>
      </label>
      <div className="stat-grid">
        {["Present", "Absent", "Late", "Unmarked"].map((status) => (
          <div className="stat-card" key={status}>
            <p>{status}</p>
            <strong>
              {report.data.filter((r) => r.status === status).length}
            </strong>
          </div>
        ))}
      </div>
      <div className="panel table-scroll">
        <table>
          <thead>
            <tr>
              <th>Student</th>
              <th>Course</th>
              <th>Session date</th>
              <th>Status</th>
              <th>Method / reason</th>
            </tr>
          </thead>
          <tbody>
            {report.data.map((r) => (
              <tr key={r.session_id + r.student_id}>
                <td>
                  {r.student_name}
                  <small>{r.student_id}</small>
                </td>
                <td>{r.course}</td>
                <td>{date(r.started_at)}</td>
                <td>
                  <Badge>{r.status}</Badge>
                </td>
                <td>
                  {r.method || "—"}
                  <small>{r.reason}</small>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!report.data.length && (
          <Empty>No attendance records match this selection.</Empty>
        )}
      </div>
    </>
  );
}

function SettingsPanel({ user, version, run, busy, notify }: PanelProps) {
  const resource = useResource<Settings | null>("/settings", null, version);
  const [config, setConfig] = useState<Settings | null>(null);
  useEffect(() => {
    if (resource.data) setConfig(resource.data);
  }, [resource.data]);
  return (
    <>
      <h1>System settings</h1>
      <p className="muted">Recognition configuration and account access.</p>
      <AccountSecurity busy={busy} run={run} notify={notify} />
      <ErrorNotice error={resource.error} />
      {config && (
        <form
          className="panel"
          onSubmit={(e) => {
            e.preventDefault();
            void run(async () => {
              await api("/settings", "PUT", config);
              notify("Configuration saved. New analyses use these settings.");
            });
          }}
        >
          <fieldset disabled={user.role !== "ADMIN" || busy}>
            <label>
              Institution
              <input
                value={config.institution}
                required
                maxLength={120}
                onChange={(e) =>
                  setConfig({ ...config, institution: e.target.value })
                }
              />
            </label>
            <div className="form-grid">
              <label>
                Similarity threshold
                <input
                  type="number"
                  min={0.1}
                  max={0.99}
                  step={0.01}
                  required
                  value={config.recognition_threshold}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      recognition_threshold: Number(e.target.value),
                    })
                  }
                />
              </label>
              <label>
                Minimum match margin
                <input
                  type="number"
                  min={0.01}
                  max={0.5}
                  step={0.01}
                  required
                  value={config.ambiguity_margin}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      ambiguity_margin: Number(e.target.value),
                    })
                  }
                />
              </label>
              <label>
                Minimum face size (pixels)
                <input
                  type="number"
                  min={40}
                  max={500}
                  required
                  value={config.min_face_size}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      min_face_size: Number(e.target.value),
                    })
                  }
                />
              </label>
            </div>
            <p className="muted">
              Engine: OpenCV YuNet + SFace. Calibrate thresholds against your
              own camera conditions. Changing thresholds affects candidate
              selection; operator confirmation is always required.
            </p>
            <button className="primary">Save configuration</button>
          </fieldset>
        </form>
      )}
      {user.role === "ADMIN" && (
        <>
          <CameraManagement version={version} run={run} busy={busy} />
          <UsersPanel
            user={user}
            version={version}
            run={run}
            busy={busy}
            notify={notify}
          />
        </>
      )}
    </>
  );
}

function UsersPanel({ user, version, run, busy, notify }: PanelProps) {
  const users = useResource<(User & { active: number })[]>(
    "/users",
    [],
    version,
  );
  const [form, setForm] = useState({
    username: "",
    name: "",
    password: "",
    role: "OPERATOR",
  });
  const [deactivate, setDeactivate] = useState<User | null>(null);
  return (
    <div className="panel">
      <h2>Team accounts</h2>
      <ErrorNotice error={users.error} />
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Role</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {users.data.map((u) => (
            <tr key={u.id}>
              <td>
                {u.name}
                <small>{u.username}</small>
              </td>
              <td>{u.role}</td>
              <td>{u.active ? "Active" : "Inactive"}</td>
              <td>
                {u.active && u.id !== user.id && (
                  <button onClick={() => setDeactivate(u)}>Deactivate</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <details>
        <summary>Add a team account</summary>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void run(async () => {
              await api("/users", "POST", form);
              setForm({
                username: "",
                name: "",
                password: "",
                role: "OPERATOR",
              });
              notify("Team account created.");
            });
          }}
        >
          <div className="form-grid">
            {(["username", "name", "password"] as const).map((key) => (
              <label key={key}>
                {key[0].toUpperCase() + key.slice(1)}
                <input
                  required
                  type={key === "password" ? "password" : "text"}
                  minLength={key === "password" ? 12 : 1}
                  autoComplete={key === "password" ? "new-password" : "off"}
                  value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                />
              </label>
            ))}
            <label>
              Role
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
              >
                <option>OPERATOR</option>
                <option>VIEWER</option>
                <option>ADMIN</option>
              </select>
            </label>
          </div>
          <p className="muted">
            Operators manage capture, review, and attendance. Viewers read
            reports. Administrators also manage students, consent, rosters,
            settings, and accounts.
          </p>
          <button className="primary" disabled={busy}>
            Create account
          </button>
        </form>
      </details>
      {deactivate && (
        <Modal
          title={"Deactivate " + deactivate.name + "?"}
          close={() => setDeactivate(null)}
        >
          <p>All active sessions for this account will be revoked.</p>
          <button
            className="danger"
            disabled={busy}
            onClick={() =>
              void run(async () => {
                await api("/users/" + deactivate.id, "DELETE");
                setDeactivate(null);
                notify("Account deactivated.");
              })
            }
          >
            Deactivate account
          </button>
        </Modal>
      )}
    </div>
  );
}

export function AuditModal({
  close,
  version,
}: {
  close: () => void;
  version: number;
}) {
  const audit = useResource<Audit[]>("/audit", [], version);
  return (
    <Modal title="Audit log" close={close}>
      <ErrorNotice error={audit.error} />
      <p className="muted">
        Latest 500 events. Attendance changes include before/after values and
        the operator’s reason.
      </p>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Time / operator</th>
              <th>Action</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {audit.data.map((a) => (
              <tr key={a.id}>
                <td>
                  {date(a.created_at)}
                  <small>{a.actor_name}</small>
                </td>
                <td>
                  {a.action}
                  <small>{a.target}</small>
                </td>
                <td className="wrap-cell">{a.details}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Modal>
  );
}
