// src/middlewares/authMiddleware.js
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/**
 * protect - Verify JWT token and attach user to req.user
 * Usage: router.get('/private', protect, handler)
 */
export const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Not authorized, token missing' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Not authorized, token missing' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ message: 'Not authorized, token invalid' });
    }

    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({ message: 'Not authorized, user not found' });
    }

    // attach user to request object
    req.user = user;
    next();
  } catch (error) {
    console.error('Protect middleware error:', error);
    res.status(500).json({ message: 'Server error in auth' });
  }
};

/**
 * adminOnly - allow only admin role
 * Usage: router.post('/', protect, adminOnly, handler)
 */
export const adminOnly = (req, res, next) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Not authorized' });
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admin access required' });
    next();
  } catch (error) {
    console.error('adminOnly middleware error:', error);
    res.status(500).json({ message: 'Server error in auth' });
  }
};
