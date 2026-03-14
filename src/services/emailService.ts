import emailjs from '@emailjs/browser';

// EmailJS configuration — replace with your actual IDs
const SERVICE_ID = 'service_eghiyme';
const TEMPLATE_ID = 'template_4v9rsyj';
const PUBLIC_KEY = '4aMkGokEYDP1_lL5-'; // Default public key

export interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

/**
 * Send an email via EmailJS.
 * @param data - Form fields to send
 * @param publicKey - EmailJS public key from settings
 */
export async function sendEmail(
  data: ContactFormData,
  publicKey: string
): Promise<void> {
  await emailjs.send(
    SERVICE_ID,
    TEMPLATE_ID,
    {
      from_name: data.name,
      from_email: data.email,
      subject: data.subject,
      message: data.message,
    },
    publicKey || PUBLIC_KEY
  );
}
