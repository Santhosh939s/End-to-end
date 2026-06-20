"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OtpRepository = void 0;
const Otp_1 = __importDefault(require("../models/Otp"));
const bcrypt_1 = __importDefault(require("bcrypt"));
class OtpRepository {
    static async createOtp(email, otp) {
        // Delete any existing OTPs for this email first
        await Otp_1.default.deleteMany({ email });
        // Hash the OTP before saving to database
        const hashedOtp = await bcrypt_1.default.hash(otp, 10);
        const newOtp = new Otp_1.default({ email, otp: hashedOtp });
        return newOtp.save();
    }
    static async verifyOtp(email, otp) {
        // Find the record by email only, since OTP is hashed
        const record = await Otp_1.default.findOne({ email });
        if (record) {
            // Compare the plain text OTP with the hashed OTP in the database
            const isValid = await bcrypt_1.default.compare(otp, record.otp);
            if (isValid) {
                // If valid, delete it so it can't be reused
                await Otp_1.default.deleteOne({ _id: record._id });
                return true;
            }
        }
        return false;
    }
}
exports.OtpRepository = OtpRepository;
//# sourceMappingURL=otp.repository.js.map