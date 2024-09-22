import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import {server,cred} from '../config/config'

const { ADMIN_USERNAME, ADMIN_PASSWORD_HASH, SUPER_ADMIN_USERNAME, SUPER_ADMIN_PASSWORD_HASH, JWT_SECRET } = cred;


export const authenticateUser = (username: string, password: string): string | null => {
  let role: string | null = null;

  // Check if the user is an admin
  if (username === ADMIN_USERNAME && bcrypt.compareSync(password, ADMIN_PASSWORD_HASH)) {
    role = 'admin';
  }

  // Check if the user is a super admin
  if (username === SUPER_ADMIN_USERNAME && bcrypt.compareSync(password, SUPER_ADMIN_PASSWORD_HASH)) {
    role = 'super_admin';
  }

  // If the role is identified (admin or super admin), generate a token
  if (role) {
    const token = jwt.sign({ username, role }, JWT_SECRET || 'secret', { expiresIn: '1h' });
    return token;
  }

  // If no matching credentials, return null
  return null;
};

export const verifyToken = (token: string): any => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};
