import type { IssueStatus, IssueType } from "../../types";

export interface IIssue {
  title:        string;
  description:  string;
  type:         IssueType;
  reporter_id?: number;  
  status?:      IssueStatus;
}

export interface IIssueUpdate {
  title?:       string;
  description?: string;
  type?:        IssueType;
  status?:      IssueStatus; 
}