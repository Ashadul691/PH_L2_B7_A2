
import type { IRegister, ILogin } from "./auth.interface";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool } from "../../db";
import config from "../../config";
import { generateToken } from "../../utility/generateToken";

const registerUserIntoDB =async (payload:IRegister)=>{
const{name,email,password,role}=payload ;

const hashPassword = await bcrypt.hash(password, config.bcrypt_rounds);

const result = await pool.query(
    `INSERT INTO users (name, email, password, role)
     VALUES ($1, $2, $3, COALESCE($4, 'contributor'))
     RETURNING id, name, email, role, created_at, updated_at`,
    [name, email, hashPassword, role],);

  return result.rows[0];
};


const loginUserIntoDB = async (payload: ILogin) => {
  const { email, password } = payload;

  const userData = await pool.query(
    `SELECT * FROM users WHERE email = $1`,
    [email],
  );

  if (userData.rows.length === 0) {throw new Error("Invalid credentials!");}


  const user = userData.rows[0];
  const passwordMatch = await bcrypt.compare(password, user.password);

  if (!passwordMatch) {
    throw new Error("Invalid credentials!"); 
  }


  const token = generateToken({ id: user.id, name: user.name, role: user.role });

  const { password: _removed, ...safeUser } = user;
  return { token, user: safeUser };
};

export { registerUserIntoDB, loginUserIntoDB };