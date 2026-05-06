import jwt from 'jsonwebtoken';

export function generateToken(user) {
  return jwt.sign(
    { id: user._id.toString(), role: user.role },
    process.env.JWT_SECRET || 'dev-secret-change-me',
    { expiresIn: process.env.JWT_EXPIRES || '7d' }
  );
}
