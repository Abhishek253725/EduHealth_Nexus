import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export function protect(req, res, next) {
  let token;
  const auth = req.headers.authorization;
  if (auth && auth.startsWith('Bearer ')) {
    token = auth.split(' ')[1];
  }
  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret-change-me');
    req.userId = decoded.id;
    req.userRole = decoded.role;
    next();
  } catch {
    return res.status(401).json({ message: 'Not authorized, token failed' });
  }
}

export function authorize(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.userRole)) {
      return res.status(403).json({ message: 'Forbidden for this role' });
    }
    next();
  };
}

/** Loads full user doc onto req.user */
export async function attachUser(req, res, next) {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) return res.status(401).json({ message: 'User not found' });
    req.user = user;
    next();
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
}
