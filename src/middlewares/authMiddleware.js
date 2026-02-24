const jwt = require("jsonwebtoken");

const authMiddleware = {
  protect: async (request, response, next) => {
    try {
      console.log(
        `[AUTH] ${request.method} ${request.originalUrl || request.url} -> path: ${request.path}`,
      );
      const token = request.cookies?.jwtToken;

      if (!token) {
        console.log(`[AUTH] No token found for ${request.path}`);
        return response.status(401).json({
          error: "Unauthorized access",
        });
      }

      try {
        const user = jwt.verify(token, process.env.JWT_SECRET);
        // Map 'id' from JWT to '_id' for database consistency
        request.user = {
          ...user,
          _id: user.id,
        };
        next();
      } catch (error) {
        return response.status(401).json({
          error: "Unauthorized access",
        });
      }
    } catch (error) {
      response.status(500).json({
        message: "Internal server error",
      });
    }
  },
};

module.exports = authMiddleware;
