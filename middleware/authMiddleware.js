const jwt = require('jsonwebtoken');

function verifyTokenOptional(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      req.userId = null;
      return next();
    }

    verifyToken(req, res, next);
  } catch (err) {
    req.userId = null;
    next();
  }
}

function verifyToken(req, res, next) {
  const header = req.headers['authorization'] || '';
  const token  = header.startsWith('Bearer ') ? header.slice(7) : header;

  if (!token) {
    return res.status(401).json({ success: false, message: 'គ្មាន Token (No token provided)' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId   = decoded.id;
    req.userRole = decoded.role;
    next();
  } catch (err) {
    const msg = err.name === 'TokenExpiredError'
      ? 'Token ផុតកំណត់ (Token expired)'
      : 'Token មិនត្រឹមត្រូវ (Invalid token)';
    return res.status(401).json({ success: false, message: msg });
  }
}


function requireAdmin(req, res, next) {
  if (req.userRole !== 'admin') {
    return res.status(403).json({ success: false, message: 'តម្រូវការ Admin (Admin required)' });
  }
  next();
}

// function verifyTokenOptional(req, res, next) {
//   try {
//     const auth = req.headers.authorization;
//     if (!auth) return next(); // allow view without login

//     verifyToken(req, res, next);
//   } catch (e) {
//     next();
//   }
// }

module.exports = { verifyToken, requireAdmin, verifyTokenOptional };
