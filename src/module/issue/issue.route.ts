import { Router } from "express";
import { issueController } from "./issue.controller";

const router = Router();


router.get("/",    issueController.getAllIssues);
router.get("/:id", issueController.getSingleIssue);


router.post("/",      issueController.createIssue);
router.put("/:id",  issueController.updateIssue);
router.delete("/:id", issueController.deleteIssue);

export const issueRoute = router;