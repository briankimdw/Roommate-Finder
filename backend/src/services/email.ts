import nodemailer from 'nodemailer';
import { generateEmailVerificationToken, generatePasswordResetToken } from '../middleware/auth';

// Email transporter configuration
const createTransporter = () => {
  if (process.env.NODE_ENV === 'production') {
    // Production email configuration
    return nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } else {
    // Development - use Ethereal Email for testing
    return nodemailer.createTransporter({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: 'ethereal.user@ethereal.email',
        pass: 'ethereal.pass',
      },
    });
  }
};

const transporter = createTransporter();

// Email templates
const getEmailTemplate = (type: 'verification' | 'password-reset' | 'welcome', data: any) => {
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  
  switch (type) {
    case 'verification':
      return {
        subject: 'Verify Your Email - Roommate Finder',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Welcome to Roommate Finder!</h2>
            <p>Hi ${data.name},</p>
            <p>Thanks for signing up! Please verify your email address by clicking the button below:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${baseUrl}/verify-email?token=${data.token}" 
                 style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Verify Email Address
              </a>
            </div>
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p style="word-break: break-all;">${baseUrl}/verify-email?token=${data.token}</p>
            <p>This link will expire in 24 hours.</p>
            <hr style="margin: 30px 0;">
            <p style="color: #666; font-size: 14px;">
              If you didn't create an account with Roommate Finder, please ignore this email.
            </p>
          </div>
        `,
        text: `
          Welcome to Roommate Finder!
          
          Hi ${data.name},
          
          Thanks for signing up! Please verify your email address by visiting this link:
          ${baseUrl}/verify-email?token=${data.token}
          
          This link will expire in 24 hours.
          
          If you didn't create an account with Roommate Finder, please ignore this email.
        `,
      };

    case 'password-reset':
      return {
        subject: 'Reset Your Password - Roommate Finder',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Password Reset Request</h2>
            <p>Hi ${data.name},</p>
            <p>We received a request to reset your password for your Roommate Finder account.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${baseUrl}/reset-password?token=${data.token}" 
                 style="background-color: #dc3545; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Reset Password
              </a>
            </div>
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p style="word-break: break-all;">${baseUrl}/reset-password?token=${data.token}</p>
            <p>This link will expire in 1 hour.</p>
            <hr style="margin: 30px 0;">
            <p style="color: #666; font-size: 14px;">
              If you didn't request a password reset, please ignore this email. Your password will remain unchanged.
            </p>
          </div>
        `,
        text: `
          Password Reset Request
          
          Hi ${data.name},
          
          We received a request to reset your password for your Roommate Finder account.
          
          Please visit this link to reset your password:
          ${baseUrl}/reset-password?token=${data.token}
          
          This link will expire in 1 hour.
          
          If you didn't request a password reset, please ignore this email.
        `,
      };

    case 'welcome':
      return {
        subject: 'Welcome to Roommate Finder!',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Welcome to Roommate Finder!</h2>
            <p>Hi ${data.name},</p>
            <p>Your email has been successfully verified! You can now:</p>
            <ul>
              <li>Complete your profile with preferences</li>
              <li>Search for compatible roommates</li>
              <li>Send and receive match requests</li>
              <li>Start conversations with your matches</li>
            </ul>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${baseUrl}/dashboard" 
                 style="background-color: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Get Started
              </a>
            </div>
            <p>Happy roommate hunting!</p>
            <p>The Roommate Finder Team</p>
          </div>
        `,
        text: `
          Welcome to Roommate Finder!
          
          Hi ${data.name},
          
          Your email has been successfully verified! You can now:
          - Complete your profile with preferences
          - Search for compatible roommates
          - Send and receive match requests
          - Start conversations with your matches
          
          Visit ${baseUrl}/dashboard to get started.
          
          Happy roommate hunting!
          The Roommate Finder Team
        `,
      };

    default:
      throw new Error('Unknown email template type');
  }
};

// Send email verification
export const sendVerificationEmail = async (user: { id: number; email: string; name: string }) => {
  try {
    const token = generateEmailVerificationToken(user.id);
    const template = getEmailTemplate('verification', { name: user.name, token });

    const mailOptions = {
      from: process.env.FROM_EMAIL || 'noreply@roommatefinder.com',
      to: user.email,
      subject: template.subject,
      text: template.text,
      html: template.html,
    };

    const info = await transporter.sendMail(mailOptions);
    
    if (process.env.NODE_ENV !== 'production') {
      console.log('Verification email sent:', nodemailer.getTestMessageUrl(info));
    }

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Failed to send verification email:', error);
    return { success: false, error };
  }
};

// Send password reset email
export const sendPasswordResetEmail = async (user: { id: number; email: string; name: string }) => {
  try {
    const token = generatePasswordResetToken(user.id);
    const template = getEmailTemplate('password-reset', { name: user.name, token });

    const mailOptions = {
      from: process.env.FROM_EMAIL || 'noreply@roommatefinder.com',
      to: user.email,
      subject: template.subject,
      text: template.text,
      html: template.html,
    };

    const info = await transporter.sendMail(mailOptions);
    
    if (process.env.NODE_ENV !== 'production') {
      console.log('Password reset email sent:', nodemailer.getTestMessageUrl(info));
    }

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Failed to send password reset email:', error);
    return { success: false, error };
  }
};

// Send welcome email
export const sendWelcomeEmail = async (user: { email: string; name: string }) => {
  try {
    const template = getEmailTemplate('welcome', { name: user.name });

    const mailOptions = {
      from: process.env.FROM_EMAIL || 'noreply@roommatefinder.com',
      to: user.email,
      subject: template.subject,
      text: template.text,
      html: template.html,
    };

    const info = await transporter.sendMail(mailOptions);
    
    if (process.env.NODE_ENV !== 'production') {
      console.log('Welcome email sent:', nodemailer.getTestMessageUrl(info));
    }

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Failed to send welcome email:', error);
    return { success: false, error };
  }
};

// Test email configuration
export const testEmailConfig = async () => {
  try {
    await transporter.verify();
    console.log('Email configuration is valid');
    return true;
  } catch (error) {
    console.error('Email configuration error:', error);
    return false;
  }
};