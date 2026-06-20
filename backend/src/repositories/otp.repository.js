"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OtpRepository = void 0;
const Otp_1 = __importDefault(require("../models/Otp"));
class OtpRepository {
    static async createOtp(email, otp) {
        // Delete any existing OTPs for this email first
        await Otp_1.default.deleteMany({ email });
        const newOtp = new Otp_1.default({ email, otp });
        return newOtp.save();
    }
    static async verifyOtp(email, otp) {
        const record = await Otp_1.default.findOne({ email, otp });
        if (record) {
            // If valid, delete it so it can't be reused
            await Otp_1.default.deleteOne({ _id: record._id });
            return true;
        }
        return false;
    }
}
exports.OtpRepository = OtpRepository;
//# sourceMappingURL=otp.repository.js.map