import Otp from '../models/Otp';

export class OtpRepository {
  static async createOtp(email: string, otp: string) {
    // Delete any existing OTPs for this email first
    await Otp.deleteMany({ email });
    
    const newOtp = new Otp({ email, otp });
    return newOtp.save();
  }

  static async verifyOtp(email: string, otp: string): Promise<boolean> {
    const record = await Otp.findOne({ email, otp });
    if (record) {
      // If valid, delete it so it can't be reused
      await Otp.deleteOne({ _id: record._id });
      return true;
    }
    return false;
  }
}
