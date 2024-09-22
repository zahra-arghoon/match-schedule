"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const userController_1 = require("../controllers/userController");
const router = (0, express_1.Router)();
// Route to get all users
router.get('/', userController_1.getAllUsers);
// Route to create a new user
router.post('/', userController_1.createUser);
exports.default = router;
