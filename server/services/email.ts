import nodemailer from 'nodemailer';
import { User, Contact } from '@shared/schema';

// Interface for email sending options
export interface SendEmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
  from?: string;
}

// For more advanced emails with contact context
export interface SendContactEmailOptions {
  contact: Contact;
  subject: string;
  message: string;
  from?: {
    name: string;
    email: string;
  };
}

/**
 * Creates and configures an SMTP transporter using environment variables
 */
export function createTransporter() {
  // Get SMTP configuration from environment variables
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const secure = process.env.SMTP_SECURE === 'true';
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const fromEmail = process.env.SMTP_FROM_EMAIL || 'noreply@aicrm.com';
  const fromName = process.env.SMTP_FROM_NAME || 'AI-CRM';

  if (!host || !user || !pass) {
    console.error('SMTP configuration missing. Email functionality will be unavailable.');
    return null;
  }

  // Create a transporter object
  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
    tls: {
      // Do not fail on invalid certificates
      rejectUnauthorized: false,
    },
  });

  return {
    transporter,
    defaultSender: {
      name: fromName,
      address: fromEmail
    }
  };
}

/**
 * Sends an email through the configured SMTP server
 */
export async function sendEmail(options: SendEmailOptions): Promise<boolean> {
  try {
    // Create the transporter
    const smtp = createTransporter();

    if (!smtp) {
      throw new Error('SMTP not configured properly');
    }

    const { transporter, defaultSender } = smtp;

    // Prepare the email options
    const mailOptions = {
      from: options.from || defaultSender,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html || options.text,
    };

    // Send the email
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);

    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

/**
 * Sends an email to a contact from a user
 */
export async function sendContactEmail(
  user: User,
  options: SendContactEmailOptions
): Promise<boolean> {
  try {
    // Check if the contact has an email
    if (!options.contact.email) {
      throw new Error('Contact does not have an email address');
    }

    // Create the transporter
    const smtp = createTransporter();

    if (!smtp) {
      throw new Error('SMTP not configured properly');
    }

    const { transporter, defaultSender } = smtp;

    // Use user information for the sender if not provided
    const fromName = options.from?.name || user.fullName;
    const fromEmail = options.from?.email || defaultSender.address;

    // Prepare the email options
    const mailOptions = {
      from: {
        name: fromName,
        address: fromEmail
      },
      to: options.contact.email,
      subject: options.subject,
      text: options.message,
      html: options.message.replace(/\n/g, '<br>'),
      replyTo: user.email || fromEmail,
    };

    // Send the email
    const info = await transporter.sendMail(mailOptions);
    console.log('Contact email sent:', info.messageId);

    return true;
  } catch (error) {
    console.error('Error sending contact email:', error);
    return false;
  }
}