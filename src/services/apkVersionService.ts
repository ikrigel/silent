import { writeLog } from './logService';

/** Module-level cache to prevent duplicate API calls */
let cachedVersion: string | null | undefined = undefined;

/**
 * Fetch the latest GitHub release tag from the Silent repository.
 * Uses public GitHub API — no authentication required.
 * Results are cached to avoid duplicate API calls (Header + About pages).
 */
export async function getLatestApkVersion(): Promise<string | null> {
  if (cachedVersion !== undefined) return cachedVersion;

  try {
    const response = await fetch(
      'https://api.github.com/repos/ikrigel/silent/releases/latest',
      { headers: { Accept: 'application/vnd.github+json' } }
    );

    if (!response.ok) {
      writeLog('error', `apkVersionService: GitHub API returned ${response.status}`);
      cachedVersion = null;
      return null;
    }

    const data = await response.json();
    const tagName = data.tag_name as string; // e.g., "v1.0.1"
    writeLog('verbose', `apkVersionService: Latest version from GitHub: ${tagName}`);
    cachedVersion = tagName;
    return tagName;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    writeLog('error', `apkVersionService: Failed to fetch latest version: ${msg}`);
    cachedVersion = null;
    return null;
  }
}

/**
 * Compare two semantic version strings.
 * Returns true if the remote version is newer than the current version.
 *
 * @param current Current version (e.g., "1.0.0" or "v1.0.0")
 * @param remote Remote version (e.g., "1.0.1" or "v1.0.1")
 * @returns true if remote > current
 */
export function isNewerVersion(current: string, remote: string): boolean {
  try {
    // Strip leading 'v' if present and split by '.'
    const parse = (v: string): number[] => {
      const cleaned = v.replace(/^v/, '');
      return cleaned.split('.').map((part) => parseInt(part, 10));
    };

    const [currentMajor, currentMinor, currentPatch] = parse(current);
    const [remoteMajor, remoteMinor, remotePatch] = parse(remote);

    if (remoteMajor > currentMajor) return true;
    if (remoteMajor === currentMajor && remoteMinor > currentMinor) return true;
    if (remoteMajor === currentMajor && remoteMinor === currentMinor && remotePatch > currentPatch) return true;

    return false;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    writeLog('error', `apkVersionService: Version comparison failed: ${msg}`);
    return false;
  }
}
