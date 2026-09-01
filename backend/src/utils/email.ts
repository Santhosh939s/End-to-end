import nodemailer from 'nodemailer';

export const sendOtpEmail = async (to: string, otp: string) => {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (!user || !pass) {
    console.warn("EMAIL_USER or EMAIL_PASS not set in environment variables. OTP will not be sent.");
    // In development without credentials, just log it. 
    // In production, this should throw an error.
    console.log(`[DEV OTP] Send to ${to}: ${otp}`);
    if (process.env.NODE_ENV === 'production') {
      throw new Error("Email configuration missing on server.");
    }
    return;
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user,
      pass,
    },
  });

  const mailOptions = {
    from: `"CipherLink Security" <${user}>`,
    to,
    subject: 'CipherLink - Your Verification Code',
    text: `Your verification code is: ${otp}\n\nThis code will expire in 10 minutes. If you did not request this, please ignore this email.`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; border: 1px solid #eaeaec; border-radius: 10px;">
        <h2 style="color: #2563eb;">CipherLink Verification</h2>
        <p>You are attempting to register a new account on CipherLink.</p>
        <p>Your 6-digit verification code is:</p>
        <h1 style="font-size: 36px; letter-spacing: 5px; color: #1e293b; background: #f1f5f9; padding: 15px; text-align: center; border-radius: 8px;">${otp}</h1>
        <p>This code will expire in 10 minutes.</p>
        <p style="color: #64748b; font-size: 12px; margin-top: 30px;">If you did not request this code, please ignore this email.</p>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
};

export const sendEmail = async (to: string, subject: string, html: string) => {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (!user || !pass) {
    console.warn("EMAIL_USER or EMAIL_PASS not set in environment variables.");
    return;
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user,
      pass,
    },
  });

  await transporter.sendMail({
    from: `"CipherLink" <${user}>`,
    to,
    subject,
    html,
  });
};
