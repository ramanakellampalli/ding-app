export type StatusColor = "approved" | "pending" | "rfe" | "denied" | "unknown";

export interface CaseStatus {
  title: string;
  description: string;
  color: StatusColor;
  rawHtml?: string;
  checkedAt: string; // ISO date string
}

export interface CaseHistoryEntry {
  id: string;
  title: string;
  description: string;
  color: StatusColor;
  recordedAt: string; // ISO date string
}

export interface USCISCase {
  id: string;
  userId: string;
  receiptNumber: string;
  nickname?: string;
  formType?: string;
  currentStatus: CaseStatus;
  history: CaseHistoryEntry[];
  lastChecked: string; // ISO date string
  lastRefreshed?: string; // ISO date string
  createdAt: string; // ISO date string
  notifyAllUpdates: boolean;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  fcmToken?: string;
  notifyEmail: boolean;
  notifyPush: boolean;
  notifyAllUpdates: boolean;
  createdAt: string;
}

export interface NotificationRecord {
  id: string;
  userId: string;
  caseId: string;
  receiptNumber: string;
  nickname?: string;
  oldStatus: string;
  newStatus: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface VisaBulletin {
  month: string;
  year: string;
  employmentBasedFinal: Record<string, Record<string, string>>;
  employmentBasedDates: Record<string, Record<string, string>>;
  familyBasedFinal: Record<string, Record<string, string>>;
  familyBasedDates: Record<string, Record<string, string>>;
  fetchedAt: string;
}

export interface DashboardStats {
  total: number;
  approved: number;
  pending: number;
  needAttention: number;
}

export type ReceiptPrefix =
  | "EAC"
  | "WAC"
  | "LIN"
  | "SRC"
  | "IOE"
  | "MSC"
  | "NBC"
  | "YSC"
  | "ZAR"
  | "ZCH";
