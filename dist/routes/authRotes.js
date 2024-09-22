"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = require("../controllers/authController");
const router = (0, express_1.Router)();
const authHandler_1 = require("../middlewares/authHandler");
// Login Route
router.post('/login', (req, res) => {
    const { username, password } = req.body;
    // Authenticate the user and generate a token
    const token = (0, authController_1.authenticateUser)(username, password);
    if (token) {
        return res.json({ token });
    }
    else {
        return res.status(401).json({ message: 'Invalid credentials' });
    }
});
// Protected Route
router.get('/protected', authHandler_1.authMiddleware, (req, res) => {
    res.json({ message: `Hello, ${req.user.username}! You have access to this route.` });
});
exports.default = router;
