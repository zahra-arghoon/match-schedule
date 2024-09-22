"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const body_parser_1 = __importDefault(require("body-parser"));
const dotenv_1 = require("dotenv");
const routes_1 = __importDefault(require("./routes/routes"));
// Load environment variables from .env file
(0, dotenv_1.config)();
const app = (0, express_1.default)();
// Middlewares
app.use((0, cors_1.default)());
app.use(body_parser_1.default.json());
// Routes
app.use('/api/users', routes_1.default);
// 404 Handler
app.use((req, res) => {
    res.status(404).json({ message: 'Resource not found' });
});
exports.default = app;
