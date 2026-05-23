import { pool } from "../../db";
import type { IIssue, IIssueUpdate } from "./issue.interface";
import type { IssueStatus, IssueType } from "../../types";

const getAllIssuesFromDB = async (filters: {
  sort?:   string;
  type?:   IssueType;
  status?: IssueStatus;
}) => {
  const { sort, type, status } = filters;

  const conditions: string[] = [];
  const values: unknown[]    = [];
  let   param                = 1;

  if (type)   { conditions.push(`type = $${param++}`);   values.push(type);   }
  if (status) { conditions.push(`status = $${param++}`); values.push(status); }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const order = sort === "oldest" ? "ASC" : "DESC";

  const issuesResult = await pool.query(
    `SELECT id, title, description, type, status, reporter_id, created_at, updated_at
     FROM issues
     ${where}
     ORDER BY created_at ${order}`,
    values,
  );

  const issues = issuesResult.rows;
  if (issues.length === 0) return [];

  const reporterIds = [...new Set(issues.map((i) => i.reporter_id as number))];

  const reportersResult = await pool.query(
    `SELECT id, name, role FROM users WHERE id = ANY($1::int[])`,
    [reporterIds],
  );

  const reporterMap: Record<number, { id: number; name: string; role: string }> = {};
  for (const r of reportersResult.rows) {
    reporterMap[r.id as number] = { id: r.id, name: r.name, role: r.role };
  }

  return issues.map(({ reporter_id, ...rest }) => ({
    ...rest,
    reporter: reporterMap[reporter_id as number] || null,
  }));
};

const getSingleIssueFromDB = async (id: string) => {
  const issueResult = await pool.query(
    `SELECT id, title, description, type, status, reporter_id, created_at, updated_at
     FROM issues WHERE id = $1`,
    [id],
  );

  if (!issueResult.rows[0]) return null;

  const { reporter_id, ...rest } = issueResult.rows[0];

  const reporterResult = await pool.query(
    `SELECT id, name, role FROM users WHERE id = $1`,
    [reporter_id],
  );

  
  return {
    ...rest,
    reporter: reporterResult.rows[0] || null,
  };
};

const createIssueIntoDB = async (payload: IIssue) => {
  const { title, description, type, reporter_id } = payload;

  const result = await pool.query(
    `INSERT INTO issues (title, description, type, reporter_id)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [title, description, type, reporter_id],
  );

  return result.rows[0];
};

const updateIssueInDB = async (id: string, payload: IIssueUpdate) => {
  const { title, description, type, status } = payload;

  const result = await pool.query(
    `UPDATE issues
     SET
       title       = COALESCE($1, title),
       description = COALESCE($2, description),
       type        = COALESCE($3, type),
       status      = COALESCE($4, status),
       updated_at  = NOW()
     WHERE id = $5
     RETURNING *`,
    [title ?? null, description ?? null, type ?? null, status ?? null, id],
  );

  return result.rows[0] || null;
};

const deleteIssueFromDB = async (id: string) => {
  const result = await pool.query(
    `DELETE FROM issues WHERE id = $1`,
    [id],
  );
  return result.rowCount ?? 0;
};

export const issueService = {
  getAllIssuesFromDB,
  getSingleIssueFromDB,
  createIssueIntoDB,
  updateIssueInDB,
  deleteIssueFromDB,
};