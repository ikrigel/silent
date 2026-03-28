import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import type { VercelRequest, VercelResponse } from '@vercel/node';

/** Initialize Firebase Admin SDK (only once) */
if (!getApps().length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON || '{}');
  initializeApp({
    credential: cert(serviceAccount),
  });
}

/**
 * GET /api/download-apk
 *
 * Verifies the user's Firebase ID token and returns the latest APK download URL.
 * This prevents exposing the GitHub Releases URL in the frontend.
 *
 * Headers:
 *   Authorization: Bearer {idToken}
 *
 * Response:
 *   { url: "https://github.com/.../app-release.apk", version: "v1.0.1" }
 *
 * Errors:
 *   401 — No token or invalid token
 *   404 — APK not found in latest release
 *   500 — GitHub API or other error
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Extract Bearer token from Authorization header
    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace(/^Bearer\s+/, '');

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    // Verify ID token with Firebase Admin SDK
    try {
      await getAuth().verifyIdToken(token);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('Token verification failed:', msg);
      return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }

    // Fetch latest release from GitHub API
    const githubRes = await fetch(
      `https://api.github.com/repos/${process.env.REPO_OWNER}/${process.env.REPO_NAME}/releases/latest`,
      {
        headers: { Accept: 'application/vnd.github+json' },
      }
    );

    if (!githubRes.ok) {
      console.error(`GitHub API error: ${githubRes.status}`);
      return res.status(404).json({ error: 'No releases found' });
    }

    const release = await githubRes.json();

    // Find the APK asset
    const apkAsset = release.assets?.find((asset: { name: string }) => asset.name.endsWith('.apk'));

    if (!apkAsset) {
      console.error('No APK found in latest release');
      return res.status(404).json({ error: 'APK not found in latest release' });
    }

    // Return download URL and version
    return res.status(200).json({
      url: apkAsset.browser_download_url,
      version: release.tag_name,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('Unexpected error:', msg);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
