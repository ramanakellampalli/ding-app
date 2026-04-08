import { CaseStatus } from "@/types";
import { classifyStatus } from "./uscis";

/**
 * Realistic mock USCIS responses for local development.
 * Activated when MOCK_USCIS=true in .env.local.
 *
 * Different receipt number prefixes return different statuses so you
 * can test every UI state (approved, pending, rfe, denied) without
 * hitting the real USCIS endpoint.
 */
const MOCK_STATUSES: Record<string, { title: string; description: string }> = {
  EAC: {
    title: "Case Was Received",
    description:
      "On March 15, 2024, we received your Form I-485, Application to Register Permanent Residence or Adjust Status, and mailed you a receipt notice. If you do not receive your receipt notice by April 15, 2024, please call Customer Service.",
  },
  WAC: {
    title: "Request for Evidence Was Sent",
    description:
      "On February 20, 2024, we mailed a request for evidence for your Form I-539, Application to Extend/Change Nonimmigrant Status. Please follow the instructions in the request for evidence and submit the requested evidence before the deadline.",
  },
  LIN: {
    title: "Case Was Approved",
    description:
      "On January 10, 2024, we approved your Form I-140, Immigrant Petition for Alien Workers. We sent you a notice of our decision. Please follow the instructions in the notice.",
  },
  SRC: {
    title: "Case Was Denied",
    description:
      "On April 2, 2024, we denied your Form I-485, Application to Register Permanent Residence or Adjust Status. We sent you a notice of our decision. If you disagree with our decision, you may appeal or file a motion.",
  },
  IOE: {
    title: "Case Is Being Actively Reviewed by USCIS",
    description:
      "As of April 7, 2024, we are actively reviewing your Form I-765, Application for Employment Authorization. We will mail you a written notice when we make a decision or if we need something from you.",
  },
  MSC: {
    title: "Interview Was Scheduled",
    description:
      "On March 28, 2024, we scheduled an interview for your Form I-485, Application to Register Permanent Residence or Adjust Status. We mailed you an appointment notice with the interview date, time, and location.",
  },
  NBC: {
    title: "Fingerprint Fee Was Received",
    description:
      "On March 5, 2024, we received your fingerprint fee for your Form N-400, Application for Naturalization. We will send you an appointment notice when we are ready to schedule your appointment.",
  },
  DEFAULT: {
    title: "Case Was Received",
    description:
      "On April 1, 2024, we received your form and mailed you a receipt notice. If you do not receive your receipt notice within 30 days, please contact USCIS Customer Service.",
  },
};

export function getMockCaseStatus(receiptNumber: string): CaseStatus {
  const prefix = receiptNumber.substring(0, 3).toUpperCase();
  const mock = MOCK_STATUSES[prefix] ?? MOCK_STATUSES.DEFAULT;

  return {
    title: mock.title,
    description: mock.description,
    color: classifyStatus(mock.title),
    checkedAt: new Date().toISOString(),
  };
}
