import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { sendEmail } from '../utils/email';

const router = Router();

const contactSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  message: z.string().min(10)
});

router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, message } = contactSchema.parse(req.body);

    const adminEmail = process.env.EMAIL_USER;
    
    if (!adminEmail) {
      res.status(500).json({ message: 'Server email configuration is missing.' });
      return;
    }

    const htmlContent = `
      <h2>New Contact Form Submission</h2>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Message:</strong></p>
      <p>${message}</p>
    `;

    // Send the email to the admin
    await sendEmail(adminEmail, 'CipherLink Contact Submission', htmlContent);

    // Send a confirmation email to the user
    const userHtml = `
      <h2>Thanks for contacting CipherLink!</h2>
      <p>Hi ${name},</p>
      <p>We have received your message and our team will get back to you shortly.</p>
      <br/>
      <p><em>Your original message:</em></p>
      <p>${message}</p>
    `;
    await sendEmail(email, 'We received your message - CipherLink', userHtml);

    res.json({ success: true, message: 'Message sent successfully.' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: 'Invalid input data.' });
      return;
    }
    console.error('Contact form error:', error);
    res.status(500).json({ message: 'Failed to send message.' });
  }
});

export default router;
