import type { IssueStatus, IssueType } from "../../types";

export interface IIssue {
  title:        string;
  description:  string;
  type:         IssueType;
  reporter_id?: number;  
  status?:      IssueStatus;
}