import jwt from 'jsonwebtoken';
import userData from '../database/user.data.js';
import dotenv from 'dotenv'
dotenv.config();

const isAdmin = async (req, res, next) => {
  try {
    const token = req.cookies?.token;
    if (!token) return res.status(401).json({ message: 'Unauthorized' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await userData.findOne({ email: decoded.email });

    if (user?.role !== 'admin') {
      return res.status(403).json({ message: 'Admins only' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

export default isAdmin;
