import emailjs from '@emailjs/browser';

// EmailJS configuration — replace with your actual IDs
const SERVICE_ID = 'service_eghiyme';
const TEMPLATE_ID = 'template_4v9rsyj';
const PUBLIC_KEY = '0OPkBoDHWYEvKnVDj'; // EmailJS public key

export interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
  'g-recaptcha-response'?: string;
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
  try {
    await emailjs.send(
      SERVICE_ID,
      TEMPLATE_ID,
      {
        from_name: data.name,
        from_email: data.email,
        to_name: 'Igal Krigel',
        reply_to: data.email,
        subject: data.subject,
        message: data.message,
        'g-recaptcha-response': data['g-recaptcha-response'] || '',
      },
      publicKey || PUBLIC_KEY
    );
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error(JSON.stringify(error));
  }
}
