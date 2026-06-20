"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const chat_routes_1 = __importDefault(require("./routes/chat.routes"));
const friend_routes_1 = __importDefault(require("./routes/friend.routes"));
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const admin_routes_1 = __importDefault(require("./routes/admin.routes"));
const db_1 = require("./db/db");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Routes
app.use('/api/auth', auth_routes_1.default);
app.use('/api/friends', friend_routes_1.default);
app.use('/api/chats', chat_routes_1.default);
app.use('/api/users', user_routes_1.default);
app.use('/api/admin', admin_routes_1.default);
// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'CipherLink backend is running.' });
});
// Connect to MongoDB
(0, db_1.connectDB)().then(() => {
    // Only listen on a port if not running in Vercel Serverless (production)
    if (process.env.NODE_ENV !== 'production') {
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    }
});
// Export the Express API for Vercel Serverless
module.exports = app;
//# sourceMappingURL=index.js.map