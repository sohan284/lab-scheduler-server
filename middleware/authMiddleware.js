const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Get the token from the Authorization header

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "You are not authorize!!",
      errorSources: [
        {
          path: req.path,
          message: "You are not authorize!!"
        }
      ],
      err: {
        statusCode: 401
      }
    });
  }

  // Verify the token
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(401).json({
        success: false,
        message: "You are not authorize!!",
        errorSources: [
          {
            path: req.path,
            message: "You are not authorize!!"
          }
        ],
        err: {
          statusCode: 401
        }
      });
    }

    req.user = user;
    next(); 
  });
};

module.exports = authMiddleware;
