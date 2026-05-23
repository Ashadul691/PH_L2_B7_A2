import { Router } from "express";
import { metricsController } from "./metrics.controller";
import auth from "../../middleware/auth";
import { USER_ROLE } from "../../types";
 
const router = Router();
 
router.get("/", auth(USER_ROLE.maintainer), metricsController.getMetrics);
 
export const metricsRoute = router;