import nodemailer from 'nodemailer';
import jwt from 'jsonwebtoken';

// Email configuration - only create transporter if SMTP credentials are provided
let transporter: nodemailer.Transporter | null = null;

const smtpHost = process.env.SMTP_HOST;
const smtpPort = process.env.SMTP_PORT;
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;

if (smtpHost && smtpPort && smtpUser && smtpPass) {
  const port = parseInt(smtpPort);
  const isSecure = port === 465;
  
  transporter = nodemailer.createTransport({
    host: smtpHost,
    port: port,
    secure: isSecure,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  // Test the connection
  // transporter.verify(function(error, success) {
  //   if (error) {
  //     console.error('Email service connection failed:', error);
  //   } else {
  //     console.log('Email service is ready to send messages');
  //   }
  // });
} else {
  console.warn('SMTP credentials not configured. Email functionality will be disabled.');
}

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export class EmailService {
  private static instance: EmailService;
  private transporter: nodemailer.Transporter | null = null;

  private constructor() {
    this.transporter = transporter;
  }

  public static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  async sendEmail(options: EmailOptions): Promise<void> {
    const fromEmail = process.env.SMTP_FROM || process.env.SMTP_USER;
    const fromName = process.env.SMTP_FROM_NAME || 'Re-Tree';
    const from = fromEmail ? `${fromName} <${fromEmail}>` : fromEmail;
    const resendKey = process.env.RESEND_API_KEY || process.env.RESET_PASSWORD_SECRET;

    if (resendKey && resendKey.startsWith('re_')) {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from,
          to: options.to,
          subject: options.subject,
          html: options.html,
          text: options.text,
        }),
      })
      if (!response.ok) {
        const body = await response.text()
        console.error('Resend error:', response.status, body)
        throw new Error('Failed to send email. Please try again later.')
      }
      console.log(`Email sent successfully to ${options.to}`)
      return
    }

    if (!this.transporter) {
      console.warn('Email service not configured. Skipping email send.');
      return;
    }

    try {
      const mailOptions = {
        from,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`Email sent successfully to ${options.to}`);
    } catch (error) {
      console.error('Error sending email:', error);
      
      // Provide more specific error messages based on the error type
      if (error && typeof error === 'object' && 'code' in error) {
        const errorCode = (error as any).code;
        const errorResponse = (error as any).response;
        
        if (errorCode === 'EMESSAGE' && errorResponse === '450') {
          throw new Error('Email service temporarily unavailable. Please try again later.');
        } else if (errorCode === 'EAUTH') {
          throw new Error('Email authentication failed. Please check your email configuration.');
        } else if (errorCode === 'EENVELOPE') {
          throw new Error('Invalid email configuration. Please check sender email address.');
        }
      }
      
      throw new Error('Failed to send email. Please try again later.');
    }
  }

  async sendUserInvitation(
    email: string,
    name: string | null,
    invitationToken: string,
    organizationName: string,
    inviterName: string
  ): Promise<void> {
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const invitationUrl = `${baseUrl}/invite?token=${invitationToken}`;

    const subject = `You've been invited to join ${organizationName}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Invitation to join ${organizationName}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #10b981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🌱 Re-Tree</h1>
          </div>
          <div class="content">
            <h2>You've been invited!</h2>
            <p>Hello ${name || email},</p>
            <p>${inviterName} has invited you to join <strong>${organizationName}</strong> on Re-Tree.</p>
            <p>Re-Tree is a platform for managing reforestation projects, tracking plant growth, and coordinating planting activities.</p>
            <p>Click the button below to accept the invitation and set up your account:</p>
            <div style="text-align: center;">
              <a href="${invitationUrl}" class="button">Accept Invitation</a>
            </div>
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #6b7280;">${invitationUrl}</p>
            <p>This invitation link will expire in 7 days for security reasons.</p>
            <p>If you have any questions, please contact your organization administrator.</p>
          </div>
          <div class="footer">
            <p>This email was sent from Re-Tree. If you didn't expect this invitation, you can safely ignore this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      You've been invited!
      
      Hello ${name || email},
      
      ${inviterName} has invited you to join ${organizationName} on Re-Tree.
      
      Re-Tree is a platform for managing reforestation projects, tracking plant growth, and coordinating planting activities.
      
      To accept the invitation, visit: ${invitationUrl}
      
      This invitation link will expire in 7 days for security reasons.
      
      If you have any questions, please contact your organization administrator.
    `;

    await this.sendEmail({
      to: email,
      subject,
      html,
      text,
    });
  }

  async sendPasswordReset(
    email: string,
    name: string | null,
    resetToken: string
  ): Promise<void> {
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;

    const subject = 'Reset your Re-Tree password';
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset your password</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #10b981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🌱 Re-Tree</h1>
          </div>
          <div class="content">
            <h2>Reset your password</h2>
            <p>Hello ${name || email},</p>
            <p>We received a request to reset your password for your Re-Tree account.</p>
            <p>Click the button below to reset your password:</p>
            <div style="text-align: center;">
              <a href="${resetUrl}" class="button">Reset Password</a>
            </div>
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #6b7280;">${resetUrl}</p>
            <p>This link will expire in 1 hour for security reasons.</p>
            <p>If you didn't request a password reset, you can safely ignore this email.</p>
          </div>
          <div class="footer">
            <p>This email was sent from Re-Tree. If you have any questions, please contact support.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      Reset your password
      
      Hello ${name || email},
      
      We received a request to reset your password for your Re-Tree account.
      
      To reset your password, visit: ${resetUrl}
      
      This link will expire in 1 hour for security reasons.
      
      If you didn't request a password reset, you can safely ignore this email.
    `;

    await this.sendEmail({
      to: email,
      subject,
      html,
      text,
    });
  }


  async sendInvitationEmail(email: string, name: string, organizationId: number): Promise<void> {
    const token = jwt.sign(
      {
        email,
        organizationId,
        type: 'invitation'
      },
      process.env.INVITATION_SECRET || '',
      { expiresIn: '7d' }
    );

    const invitationUrl = `${process.env.FRONTEND_URL}/invite/accept?token=${token}`;

    const html = `
      <h1>Welcome to Re-Tree!</h1>
      <p>Hello ${name},</p>
      <p>You have been invited to join our organization. Please click the link below to set up your account:</p>
      <p><a href="${invitationUrl}">Accept Invitation</a></p>
      <p>This link will expire in 7 days.</p>
      <p>If you have any questions, please contact your administrator.</p>
    `;

    await this.sendEmail({
      to: email,
      subject: 'Welcome to Re-Tree - Accept Your Invitation',
      html
    });
  }
}

export const emailService = EmailService.getInstance();
