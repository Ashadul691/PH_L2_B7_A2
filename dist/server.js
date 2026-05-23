

   import { createRequire } from 'module';

   const require = createRequire(import.meta.url);

  

// src/app.ts
import cors from "cors";

// src/middleware/logger.ts
import fs from "fs";
var logger = (req, res, next) => {
  const log = `${req.method} ${req.url} \u2014 ${(/* @__PURE__ */ new Date()).toISOString()}`;
  console.log(log);
  fs.appendFile("logger.txt", `
${log}
`, () => {
  });
  next();
};
var logger_default = logger;

// src/app.ts
import CookieParser from "cookie-parser";

// src/middleware/globalErrorHandler.ts
var globalErrorHandler = (err, req, res, next) => {
  console.error("Error:", err.message);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal Server Error"
  });
};
var globalErrorHandler_default = globalErrorHandler;

// src/app.ts
import express from "express";

// src/module/auth/auth.route.ts
import { Router } from "express";

// src/utility/sendResponse.ts
var sendResponse = (res, payload) => {
  res.status(payload.statusCode).json({
    success: payload.success,
    message: payload.message,
    data: payload.data,
    errors: payload.errors
  });
};
var sendResponse_default = sendResponse;

// src/module/auth/auth.service.ts
import bcrypt from "bcryptjs";
import "jsonwebtoken";

// src/db/index.ts
import { Pool } from "pg";

// src/config/index.ts
import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.join(process.cwd(), ".env") });
var config = {
  port: process.env.PORT || 5e3,
  connection_string: process.env.CONNECTIONSTRING,
  secret: process.env.JWT_SECRET,
  refresh_secret: process.env.JWT_REFRESH_SECRET
};
var config_default = config;

// src/db/index.ts
var pool = new Pool({
  connectionString: config_default.connection_string
});
var initDB = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id         SERIAL PRIMARY KEY,
        name       VARCHAR(100) NOT NULL,
        email      VARCHAR(100) UNIQUE NOT NULL,
        password   TEXT NOT NULL,
        role       VARCHAR(15) DEFAULT 'contributor' CHECK (role IN ('contributor','maintainer')),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )`);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS issues (
        id           SERIAL PRIMARY KEY,
        title        VARCHAR(150) NOT NULL,
        description  TEXT NOT NULL,
        type         VARCHAR(20) NOT NULL CHECK (type IN ('bug','feature_request')),
        status       VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open','in_progress','resolved')),
        reporter_id  INT NOT NULL,
        created_at   TIMESTAMP DEFAULT NOW(),
        updated_at   TIMESTAMP DEFAULT NOW()
      )`);
    console.log("Database connected and tables ready!");
  } catch (error) {
    console.error("Database error:", error);
    process.exit(1);
  }
};

// src/utility/generateToken.ts
import jwt from "jsonwebtoken";
var generateToken = (payload) => {
  return jwt.sign(payload, config_default.secret, { expiresIn: "1d" });
};

// src/module/auth/auth.service.ts
var registerUserIntoDB = async (payload) => {
  const { name, email, password, role } = payload;
  const hashPassword = await bcrypt.hash(password, 10);
  const result = await pool.query(
    `INSERT INTO users (name, email, password, role)
     VALUES ($1, $2, $3, COALESCE($4, 'contributor'))
     RETURNING id, name, email, role, created_at, updated_at`,
    [name, email, hashPassword, role]
  );
  return result.rows[0];
};
var loginUserIntoDB = async (payload) => {
  const { email, password } = payload;
  const userData = await pool.query(
    `SELECT * FROM users WHERE email = $1`,
    [email]
  );
  if (userData.rows.length === 0) {
    throw new Error("Invalid credentials!");
  }
  const user = userData.rows[0];
  const passwordMatch = await bcrypt.compare(password, user.password);
  if (!passwordMatch) {
    throw new Error("Invalid credentials!");
  }
  const jwtPayload = {
    id: user.id,
    name: user.name,
    role: user.role
  };
  const token = generateToken({ id: user.id, name: user.name, role: user.role });
  const { password: _removed, ...safeUser } = user;
  return { token, user: safeUser };
};

// src/module/auth/auth.controller.ts
var registerUser = async (req, res, next) => {
  try {
    const data = req.body;
    const result = await registerUserIntoDB(data);
    sendResponse_default(res, { statusCode: 201, success: true, message: "User registered successfully", data: result });
  } catch (error) {
    if (error.message.includes("duplicate key")) {
      sendResponse_default(res, { statusCode: 400, success: false, message: "Email already registered" });
    } else {
      next(error);
    }
  }
};
var loginUser = async (req, res, next) => {
  try {
    const data = req.body;
    const result = await loginUserIntoDB(data);
    sendResponse_default(res, { statusCode: 200, success: true, message: "Login successful", data: result });
  } catch (error) {
    sendResponse_default(res, { statusCode: 401, success: false, message: error.message });
  }
};
var authController = {
  registerUser,
  loginUser
};

// src/module/auth/auth.route.ts
var router = Router();
router.post("/signup", authController.registerUser);
router.post("/login", authController.loginUser);
var authRoute = router;

// src/module/issue/issue.route.ts
import { Router as Router2 } from "express";

// src/module/issue/issue.service.ts
var getAllIssuesFromDB = async (filters) => {
  const { sort, type, status } = filters;
  const conditions = [];
  const values = [];
  let param = 1;
  if (type) {
    conditions.push(`type = $${param++}`);
    values.push(type);
  }
  if (status) {
    conditions.push(`status = $${param++}`);
    values.push(status);
  }
  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const order = sort === "oldest" ? "ASC" : "DESC";
  const issuesResult = await pool.query(
    `SELECT id, title, description, type, status, reporter_id, created_at, updated_at
     FROM issues
     ${where}
     ORDER BY created_at ${order}`,
    values
  );
  const issues = issuesResult.rows;
  if (issues.length === 0) return [];
  const reporterIds = [...new Set(issues.map((i) => i.reporter_id))];
  const reportersResult = await pool.query(
    `SELECT id, name, role FROM users WHERE id = ANY($1::int[])`,
    [reporterIds]
  );
  const reporterMap = {};
  for (const r of reportersResult.rows) {
    reporterMap[r.id] = { id: r.id, name: r.name, role: r.role };
  }
  return issues.map((issue) => ({
    ...issue,
    reporter: reporterMap[issue.reporter_id] || null,
    reporter_id: void 0
  }));
};
var getSingleIssueFromDB = async (id) => {
  const issueResult = await pool.query(
    `SELECT id, title, description, type, status, reporter_id, created_at, updated_at
     FROM issues
     WHERE id = $1`,
    [id]
  );
  if (!issueResult.rows[0]) return null;
  const issue = issueResult.rows[0];
  const reporterResult = await pool.query(
    `SELECT id, name, role FROM users WHERE id = $1`,
    [issue.reporter_id]
  );
  return {
    ...issue,
    reporter: reporterResult.rows[0] || null,
    reporter_id: void 0
  };
};
var createIssueIntoDB = async (payload) => {
  const { title, description, type, reporter_id } = payload;
  const result = await pool.query(
    `INSERT INTO issues (title, description, type, reporter_id)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [title, description, type, reporter_id]
  );
  return result.rows[0];
};
var updateIssueInDB = async (id, payload) => {
  const { title, description, type, status } = payload;
  const result = await pool.query(
    `UPDATE issues
     SET
       title       = COALESCE($1, title),
       description = COALESCE($2, description),
       type        = COALESCE($3, type),
       status      = COALESCE($4, status),
       updated_at  = NOW()
     WHERE id = $5 RETURNING * `,
    [title, description, type, status, id]
  );
  return result.rows[0] || null;
};
var deleteIssueFromDB = async (id) => {
  const result = await pool.query(
    `DELETE FROM issues WHERE id = $1`,
    [id]
  );
  return result.rowCount ?? 0;
};
var issueService = {
  getAllIssuesFromDB,
  getSingleIssueFromDB,
  createIssueIntoDB,
  updateIssueInDB,
  deleteIssueFromDB
};

// src/module/issue/issue.controller.ts
var getAllIssues = async (req, res, next) => {
  try {
    const { sort, type, status } = req.query;
    const data = await issueService.getAllIssuesFromDB({ sort, type, status });
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Issues retrieved successfully",
      data
    });
  } catch (error) {
    next(error);
  }
};
var getSingleIssue = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = await issueService.getSingleIssueFromDB(id);
    if (!data) {
      sendResponse_default(res, { statusCode: 404, success: false, message: "Issue not found" });
      return;
    }
    sendResponse_default(res, { statusCode: 200, success: true, message: "Issue retrieved", data });
  } catch (error) {
    next(error);
  }
};
var createIssue = async (req, res, next) => {
  try {
    const reporter_id = req.user.id;
    const data = await issueService.createIssueIntoDB({
      ...req.body,
      reporter_id
    });
    sendResponse_default(res, {
      statusCode: 201,
      success: true,
      message: "Issue created successfully",
      data
    });
  } catch (error) {
    next(error);
  }
};
var updateIssue = async (req, res, next) => {
  try {
    const { id } = req.params;
    const requestingUser = req.user || { id: 1, role: "admin" };
    const existing = await issueService.getSingleIssueFromDB(id);
    if (!existing) {
      sendResponse_default(res, { statusCode: 404, success: false, message: "Issue not found" });
      return;
    }
    if (requestingUser.role === "contributor") {
      if (existing.reporter.id !== requestingUser.id) {
        sendResponse_default(res, { statusCode: 403, success: false, message: "Forbidden \u2014 you can only edit your own issues" });
        return;
      }
      if (existing.status !== "open") {
        sendResponse_default(res, { statusCode: 409, success: false, message: "Cannot edit \u2014 issue is no longer open" });
        return;
      }
    }
    const data = await issueService.updateIssueInDB(id, req.body);
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Issue updated successfully",
      data
    });
  } catch (error) {
    next(error);
  }
};
var deleteIssue = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deleted = await issueService.deleteIssueFromDB(id);
    if (deleted === 0) {
      sendResponse_default(res, { statusCode: 404, success: false, message: "Issue not found" });
      return;
    }
    sendResponse_default(res, { statusCode: 200, success: true, message: "Issue deleted successfully" });
  } catch (error) {
    next(error);
  }
};
var issueController = {
  getAllIssues,
  getSingleIssue,
  createIssue,
  updateIssue,
  deleteIssue
};

// src/middleware/auth.ts
import jwt3 from "jsonwebtoken";
var auth = (...roles) => {
  return async (req, res, next) => {
    try {
      const token = req.headers.authorization;
      if (!token) {
        res.status(401).json({ success: false, message: "Unauthorized \u2014 no token provided" });
        return;
      }
      const decoded = jwt3.verify(token, config_default.secret);
      if (roles.length && !roles.includes(decoded.role)) {
        res.status(403).json({ success: false, message: "Forbidden \u2014 insufficient permissions" });
        return;
      }
      req.user = decoded;
      next();
    } catch (error) {
      res.status(401).json({ success: false, message: "Invalid or expired token" });
    }
  };
};
var auth_default = auth;

// src/types/index.ts
var USER_ROLE = {
  contributor: "contributor",
  maintainer: "maintainer"
};

// src/module/issue/issue.route.ts
var router2 = Router2();
router2.get("/", issueController.getAllIssues);
router2.get("/:id", issueController.getSingleIssue);
router2.post("/", auth_default(USER_ROLE.contributor, USER_ROLE.maintainer), issueController.createIssue);
router2.put("/:id", auth_default(USER_ROLE.contributor, USER_ROLE.maintainer), issueController.updateIssue);
router2.delete("/:id", auth_default(USER_ROLE.maintainer), issueController.deleteIssue);
var issueRoute = router2;

// src/app.ts
var app = express();
app.use(CookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(logger_default);
app.use(cors({ origin: "http://localhost:3000" }));
app.get("/", (req, res) => {
  res.status(200).json({ message: "DevPulse API is running" });
});
app.use("/api/auth", authRoute);
app.use("/api/issues", issueRoute);
app.use(globalErrorHandler_default);
var app_default = app;

// src/server.ts
var main = async () => {
  await initDB();
  app_default.listen(config_default.port, () => {
    console.log(`DevPulse running on http://localhost:${config_default.port}`);
  });
};
main();
//# sourceMappingURL=server.js.map