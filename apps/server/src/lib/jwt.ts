import jwt from "jsonwebtoken";
const JWT_SECRET = process.env.JWT_SECRET!;
export interface JwtUser { id: string; email: string }
export const sign = (u: JwtUser) => jwt.sign(u, JWT_SECRET, { expiresIn: "7d" });
export const verify = (token: string) => jwt.verify(token, JWT_SECRET) as JwtUser;
