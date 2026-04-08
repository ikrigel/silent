import { VercelRequest, VercelResponse } from '@vercel/node';
import { getAuth } from 'firebase-admin/auth';
import { initializeApp, cert } from 'firebase-admin/app';

// Initialize Firebase Admin SDK
const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
};

let adminApp: ReturnType<typeof initializeApp> | null = null;
try {
  if (serviceAccount.projectId && serviceAccount.privateKey && serviceAccount.clientEmail) {
    adminApp = initializeApp({
      credential: cert(serviceAccount as any),
    });
  }
} catch (err) {
  console.error('Firebase Admin initialization failed:', err);
}

/**
 * OAuth callback handler for server-side Google auth flow.
 * Exchanges authorization code for Google ID token, then mints Firebase custom token.
 * Redirects to /login?token=<customToken> or /login?error=<reason> on failure.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only accept GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { code, error: googleError } = req.query;

  // Handle user denying consent
  if (googleError) {
    const reason = googleError === 'access_denied' ? 'denied' : String(googleError);
    console.log(`OAuth error from Google: ${reason}`);
    return res.redirect(`/login?error=${encodeURIComponent(reason)}`);
  }

  // Validate authorization code
  if (!code || typeof code !== 'string') {
    console.error('Missing authorization code');
    return res.redirect('/login?error=missing_code');
  }

  // Validate environment variables
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.error('Missing Google OAuth credentials in environment');
    return res.status(500).redirect('/login?error=server_misconfigured');
  }

  try {
    // Step 1: Exchange authorization code for Google ID token
    console.log('Exchanging authorization code for ID token...');
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: `${process.env.VERCEL_URL ? 'https://' + process.env.VERCEL_URL : 'https://silent-eight.vercel.app'}/api/auth/callback`,
        grant_type: 'authorization_code',
      }).toString(),
    });

    if (!tokenResponse.ok) {
      const errorBody = await tokenResponse.text();
      console.error(`Google token exchange failed: ${tokenResponse.status}`, errorBody);
      return res.redirect('/login?error=token_exchange_failed');
    }

    interface TokenResponse {
      id_token: string;
      access_token: string;
      expires_in: number;
    }
    const tokenData = (await tokenResponse.json()) as TokenResponse;
    const idToken = tokenData.id_token;

    if (!idToken) {
      console.error('No ID token in Google token response');
      return res.redirect('/login?error=token_exchange_failed');
    }

    // Step 2: Decode ID token to extract user info (no external JWT library needed)
    console.log('Decoding Google ID token...');
    const parts = idToken.split('.');
    if (parts.length !== 3) {
      console.error('Invalid ID token format');
      return res.redirect('/login?error=malformed_token');
    }

    // Decode payload (second part) — base64url decode
    const payload = parts[1];
    const padded = payload + '='.repeat((4 - (payload.length % 4)) % 4);
    const decoded = Buffer.from(padded, 'base64').toString('utf8');
    interface IdTokenPayload {
      sub: string;
      email: string;
      name: string;
      picture?: string;
    }
    const idTokenPayload = JSON.parse(decoded) as IdTokenPayload;

    if (!idTokenPayload.sub || !idTokenPayload.email) {
      console.error('Missing user info in ID token');
      return res.redirect('/login?error=malformed_token');
    }

    console.log(`Decoded user: ${idTokenPayload.email} (${idTokenPayload.sub})`);

    // Step 3: Create Firebase custom token using Admin SDK
    if (!adminApp) {
      console.error('Firebase Admin not initialized');
      return res.status(500).redirect('/login?error=internal_error');
    }

    console.log('Creating Firebase custom token...');
    const auth = getAuth(adminApp);
    const customToken = await auth.createCustomToken(idTokenPayload.sub, {
      email: idTokenPayload.email,
      name: idTokenPayload.name,
      picture: idTokenPayload.picture || '',
    });

    console.log('Custom token created successfully');

    // Step 4: Redirect to login page with token
    // Token will be processed by handleCustomToken() in Login page
    return res.redirect(`/login?token=${encodeURIComponent(customToken)}`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('OAuth callback error:', message, err);
    return res.status(500).redirect('/login?error=internal_error');
  }
}
