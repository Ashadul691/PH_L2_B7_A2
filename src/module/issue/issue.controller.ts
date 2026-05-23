import type { NextFunction, Request, Response } from "express";
import type { IssueStatus, IssueType } from "../../types";
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

    sendResponse(res, {
      statusCode: 200,
      success:    true,
      message:    "Issues retrieved successfully",
      data,
    });
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
   // const reporter_id = (req.user as any).id;
    const reporter_id = 1;
    const data = await issueService.createIssueIntoDB({
      ...req.body,
      reporter_id,
    });

    sendResponse(res, {
      statusCode: 201,
      success: true,
      message: "Issue created successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};

const updateIssue = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const requestingUser = (req.user as any) || { id: 1, role: "admin" };

    // issue exists or not
    const existing = await issueService.getSingleIssueFromDB(id);
    if (!existing) {
      sendResponse(res, { statusCode: 404, success: false, message: "Issue not found" });
      return;
    }
    if (requestingUser.role === "contributor") {
      if (existing.reporter.id !== requestingUser.id) {
        sendResponse(res, { statusCode: 403, success: false, message: "Forbidden — you can only edit your own issues" });
        return;
      }
      if (existing.status !== "open") {
        sendResponse(res, { statusCode: 409, success: false, message: "Cannot edit — issue is no longer open" });
        return;
      }
    }

    const data = await issueService.updateIssueInDB(id, req.body);

    sendResponse(res, {
      statusCode: 200,
      success:    true,
      message:    "Issue updated successfully",
      data,
    });
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