import Otp from '../models/Otp';
import bcrypt from 'bcrypt';

export class OtpRepository {
  static async createOtp(email: string, otp: string) {
    // Delete any existing OTPs for this email first
    await Otp.deleteMany({ email });
    
    // Hash the OTP before saving to database
    const hashedOtp = await bcrypt.hash(otp, 10);
    
    const newOtp = new Otp({ email, otp: hashedOtp });
    return newOtp.save();
  }

  static async verifyOtp(email: string, otp: string): Promise<boolean> {
    // Find the record by email only, since OTP is hashed
    const record = await Otp.findOne({ email });
    if (record) {
      // Compare the plain text OTP with the hashed OTP in the database
      const isValid = await bcrypt.compare(otp, record.otp);
      
      if (isValid) {
      // If valid, delete it so it can't be reused
      await Otp.deleteOne({ _id: record._id });
      return true;
      }
    }
    return false;
  }
}
