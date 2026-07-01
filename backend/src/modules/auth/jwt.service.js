import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';

const SECRET = env.JWT_SECRET;
const EXPIRES_IN = env.JWT_EXPIRES_IN || '7d';

export function generateToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName },
    SECRET,
    { expiresIn: EXPIRES_IN }
  );
}

export function verifyToken(token) {
  return jwt.verify(token, SECRET);
}