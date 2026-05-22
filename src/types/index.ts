export const USER_ROLE = {
  contributor: "contributor",
  maintainer:  "maintainer",
} as const;

export type ROLES = "contributor" | "maintainer";

export const ISSUE_TYPE = {
  bug:             "bug",
  feature_request: "feature_request",
} as const;
export type IssueType   = "bug" | "feature_request";


export const ISSUE_STATUS = {
  open:        "open",
  in_progress: "in_progress",
  resolved:    "resolved",
} as const;
export type IssueStatus = "open" | "in_progress" | "resolved";