export interface User {
  id: number;
  username: string;
  name: string;
  role: "ADMIN" | "OPERATOR" | "VIEWER";
}
export interface StudentRecord {
  sap_id?: string;
  id: string;
  name: string;
  email: string;
  programme: string;
  semester: number;
  section: string;
  consent: string;
  status: string;
  template: string;
  enrolled_at?: string;
  samples?: number;
}
export interface Course {
  id: number;
  code: string;
  name: string;
  term: string;
}
export interface Section {
  id: number;
  course_id: number;
  name: string;
  code: string;
  room: string;
  course_name: string;
  roster_count: number;
}
export interface Session {
  id: string;
  section_id: number;
  code: string;
  course: string;
  section: string;
  room: string;
  status: string;
  started_at: string;
  ended_at?: string;
  total: number;
  present: number;
}
export interface Attendance {
  session_id: string;
  student_id: string;
  student_name: string;
  student_status?: string;
  status: string;
  method: string;
  reason: string;
  updated_at?: string;
  course?: string;
  started_at?: string;
}
export interface Review {
  id: string;
  session_id: string;
  student_id?: string;
  student_name?: string;
  score?: number;
  margin?: number;
  reason: string;
  status: string;
  created_at: string;
}
export interface Settings {
  institution: string;
  recognition_threshold: number;
  ambiguity_margin: number;
  min_face_size: number;
}
export interface Health {
  status: string;
  setup_required: boolean;
  vision: {
    ready: boolean;
    model: string;
    missing: string[];
    liveness: string;
  };
}
export interface Dashboard {
  students: number;
  enrolled: number;
  open_sessions: number;
  pending_reviews: number;
  attendance: { status: string; count: number }[];
}
export interface Audit {
  id: number;
  actor_name: string;
  action: string;
  target: string;
  details: string;
  created_at: string;
}
export interface Detection {
  sap_id?: string;
  box: number[];
  confidence: number;
  name?: string;
  student_id?: string;
  score?: number;
  review_id?: string;
  reason: string;
  state: string;
}
export interface Analysis {
  mode: "preview" | "attendance";
  eligible_students: number;
  width: number;
  height: number;
  detections: Detection[];
}

export async function api<T>(
  path: string,
  method = "GET",
  data?: unknown,
  signal?: AbortSignal,
): Promise<T> {
  const form = data instanceof FormData;
  const response = await fetch("/api" + path, {
    method,
    credentials: "same-origin",
    signal,
    headers: {
      "X-Requested-With": "AcademicVision",
      ...(!form && data !== undefined
        ? { "Content-Type": "application/json" }
        : {}),
    },
    body: data === undefined ? undefined : form ? data : JSON.stringify(data),
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    if (
      response.status === 401 &&
      path !== "/auth/login" &&
      path !== "/auth/me"
    )
      window.dispatchEvent(new Event("auth-expired"));
    throw new Error(
      typeof payload.detail === "string"
        ? payload.detail
        : `Request failed (${response.status}).`,
    );
  }
  return response.status === 204 ? (undefined as T) : response.json();
}

export async function downloadReport(sessionId = "") {
  const response = await fetch(
    "/api/reports/export" +
      (sessionId ? "?session_id=" + encodeURIComponent(sessionId) : ""),
    { credentials: "same-origin" },
  );
  if (!response.ok)
    throw new Error("Could not export attendance. Sign in and retry.");
  const url = URL.createObjectURL(await response.blob());
  const link = document.createElement("a");
  link.href = url;
  link.download = "attendance.csv";
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
