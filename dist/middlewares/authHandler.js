"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = void 0;
const authController_1 = require("../controllers/authController");
const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        const verified = (0, authController_1.verifyToken)(token);
        if (verified) {
            req.user = verified;
            return next();
        }
    }
    return res.status(403).json({ message: 'Forbidden' });
};
exports.authMiddleware = authMiddleware;
