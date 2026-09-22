export type NavigationTab =
  | 'dashboard'
  | 'live-capture'
  | 'review-queue'
  | 'students'
  | 'enrollment'
  | 'attendance-sessions'
  | 'reports'
  | 'settings';

export interface Student {
  id: string;
  name: string;
  email: string;
  programme: string;
  semester: number;
  section: string | number;
  consent: 'RECORDED' | 'NOT_RECORDED' | 'WITHDRAWN';
  template: 'Ready (128-d)' | 'Ready' | 'Not enrolled' | 'Purged from edge';
  status: 'Active' | 'Inactive';
  avatar: string;
  vectorHash?: string;
  lastAudit?: string;
  enrolledDate?: string;
}

export interface LiveDetection {
  id: string;
  studentId: string;
  name: string;
  programme: string;
  confidence: number;
  time: string;
  status: 'CONFIRMED' | 'FLAGGED' | 'UNKNOWN';
  avatar: string;
  liveCrop: string;
  euclidianDist?: number;
  poseAngle?: string;
  lighting?: string;
  bbox: { left: string; top: string; width: string; height: string };
  note?: string;
  seatInfo?: string;
}

export interface ReviewDiscrepancy {
  id: string;
  studentId: string;
  studentName: string;
  course: string;
  venue: string;
  flagType: string;
  category: 'low-confidence' | 'lighting' | 'multi-face';
  score: number;
  requiredThreshold: number;
  liveCaptureImg: string;
  enrolledImg: string;
  enrolledDate: string;
  vectorNorm: number;
  faceBox: string;
  timestamp: string;
  status: 'pending' | 'confirmed' | 'rejected' | 'rescan';
}

export interface ClassroomVenue {
  id: string;
  name: string;
  code: string;
  subject: string;
  instructor: string;
  time: string;
  enrolledCount: number;
  presentCount: number;
  density: number;
  rtspFeed: string;
  edgeNode: string;
  bgImage: string;
  fps: number;
  resolution: string;
}

export interface AttendanceSession {
  id: string;
  date: string;
  time: string;
  venue: string;
  course: string;
  section: string;
  present: number;
  total: number;
  verifiedBy: string;
  status: 'Completed' | 'In Progress' | 'Archived';
  method: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  details: string;
  status: 'SUCCESS' | 'ALERT' | 'INFO';
  hash: string;
}
