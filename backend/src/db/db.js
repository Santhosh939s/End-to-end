"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/cipherlink';
// Global cache to prevent multiple connections in Vercel Serverless
let cached = null;
const connectDB = async () => {
    if (cached) {
        console.log('MongoDB: Using cached connection');
        return cached;
    }
    try {
        const conn = await mongoose_1.default.connect(MONGO_URI);
        cached = conn.connection;
        console.log('MongoDB Connected successfully to:', MONGO_URI);
        return cached;
    }
    catch (error) {
        console.error('MongoDB connection error:', error);
        if (process.env.NODE_ENV !== 'production') {
            process.exit(1);
        }
    }
};
exports.connectDB = connectDB;
exports.default = mongoose_1.default;
//# sourceMappingURL=db.js.map