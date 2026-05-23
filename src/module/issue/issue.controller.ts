import type { NextFunction, Request, Response } from "express";
import type { JwtPayload } from "jsonwebtoken";
import type { IssueStatus, IssueType } from "../../types";
import type { IIssueUpdate } from "./issue.interface";
import sendResponse from "../../utility/sendResponse";
import { issueService } from "./issue.service";

const getAllIssues = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sort, type, status } = req.query as {
      sort?:   string;
      type?:   IssueType;
      status?: IssueStatus;
    };

    const data = await issueService.getAllIssuesFromDB({ sort, type, status });
    sendResponse(res, { statusCode: 200, success: true, message: "Issues retrieved successfully", data });
  } catch (error) {
    next(error);
  }
};

const getSingleIssue = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const data = await issueService.getSingleIssueFromDB(id);

    if (!data) {
      sendResponse(res, { statusCode: 404, success: false, message: "Issue not found" });
      return;
    }
    sendResponse(res, { statusCode: 200, success: true, message: "Issue retrieved", data });
  } catch (error) {
    next(error);
  }
};

const createIssue = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, description, type } = req.body as {
      title:       string;
      description: string;
      type:        IssueType;
    };

  
    if (!title || !description || !type) {
      sendResponse(res, {
        statusCode: 400,
        success:    false,
        message:    "title, description, and type are required",
      });
      return;
    }
    if (title.length > 150) {
      sendResponse(res, { statusCode: 400, success: false, message: "title must be 150 characters or fewer" });
      return;
    }
    if (description.length < 20) {
      sendResponse(res, { statusCode: 400, success: false, message: "description must be at least 20 characters" });
      return;
    }
    if (!["bug", "feature_request"].includes(type)) {
      sendResponse(res, { statusCode: 400, success: false, message: "type must be bug or feature_request" });
      return;
    }

    const reporter_id = (req.user as JwtPayload).id as number;

    const data = await issueService.createIssueIntoDB({ title, description, type, reporter_id });
    sendResponse(res, { statusCode: 201, success: true, message: "Issue created successfully", data });
  } catch (error) {
    next(error);
  }
};

const updateIssue = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const requestingUser = req.user as JwtPayload;
    const existing = await issueService.getSingleIssueFromDB(id);
    if (!existing) {
      sendResponse(res, { statusCode: 404, success: false, message: "Issue not found" });
      return;
    }

    // contributor restrictions
    if (requestingUser.role === "contributor") {
      if ((existing.reporter as { id: number } | null)?.id !== requestingUser.id) {
        sendResponse(res, { statusCode: 403, success: false, message: "Forbidden — you can only edit your own issues" });
        return;
      }
      if (existing.status !== "open") {
        sendResponse(res, { statusCode: 409, success: false, message: "Cannot edit — issue is no longer open" });
        return;
      }
    }
    const { title, description, type, status } = req.body as IIssueUpdate;

    const updatePayload: IIssueUpdate = { title, description, type };
    if (requestingUser.role === "maintainer") {
      updatePayload.status = status;
    }

    const data = await issueService.updateIssueInDB(id, updatePayload);
    sendResponse(res, { statusCode: 200, success: true, message: "Issue updated successfully", data });
  } catch (error) {
    next(error);
  }
};

const deleteIssue = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const deleted = await issueService.deleteIssueFromDB(id);

    if (deleted === 0) {
      sendResponse(res, { statusCode: 404, success: false, message: "Issue not found" });
      return;
    }
    sendResponse(res, { statusCode: 200, success: true, message: "Issue deleted successfully" });
  } catch (error) {
    next(error);
  }
};

export const issueController = {
  getAllIssues,
  getSingleIssue,
  createIssue,
  updateIssue,
  deleteIssue,
};