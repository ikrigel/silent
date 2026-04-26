import { robotService } from './robotService';
import { writeLog } from './logService';

/**
 * Airplane mode operations with validation, retry, and failure logging.
 */

export interface EnableContext {
  scheduleId?: string;
  scheduleName?: string;
}

const MAX_ATTEMPTS = 3;
const RETRY_DELAYS_MS = [0, 3000, 5000];
const VALIDATION_WAIT_MS = 2500;

interface AttemptRecord {
  attempt: number;
  startedAt: string;
  stateBefore: boolean;
  stateAfter: boolean | null;
  error?: string;
  elapsedMs: number;
}

class AirplaneModeService {
  private isExecuting = false;

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async enable(ctx?: EnableContext): Promise<string> {
    if (this.isExecuting) {
      writeLog('verbose', 'airplaneModeService: Enable already in progress, skipping');
      return 'Already executing';
    }

    this.isExecuting = true;
    const overallStart = Date.now();
    const attempts: AttemptRecord[] = [];

    try {
      for (let i = 0; i < MAX_ATTEMPTS; i++) {
        if (i > 0) {
          await this.delay(RETRY_DELAYS_MS[i]);
        }

        const attemptStart = Date.now();
        const startedAt = new Date().toISOString();

        const stateBefore = await robotService.getAirplaneModeState();

        if (i === 0 && stateBefore) {
          writeLog('info', 'airplaneModeService: Airplane mode already enabled, skipping');
          return 'Already enabled';
        }

        let stateAfter: boolean | null = null;
        let attemptError: string | undefined;
        let msg = '';

        try {
          msg = await robotService.enableAirplaneMode();
          await this.delay(VALIDATION_WAIT_MS);
          stateAfter = await robotService.getAirplaneModeState();
        } catch (err: unknown) {
          attemptError = err instanceof Error ? err.message : String(err);
          stateAfter = null;
        }

        const elapsedMs = Date.now() - attemptStart;
        attempts.push({
          attempt: i + 1,
          startedAt,
          stateBefore,
          stateAfter,
          error: attemptError,
          elapsedMs,
        });

        writeLog('ultraverbose', `airplaneModeService: attempt ${i + 1} stateAfter=${stateAfter}`, {
          attempt: i + 1,
          stateAfter,
          error: attemptError,
          scheduleId: ctx?.scheduleId,
          scheduleName: ctx?.scheduleName,
        });

        if (stateAfter === true) {
          const totalElapsed = Date.now() - overallStart;
          writeLog('info', `airplaneModeService: enabled on attempt ${i + 1} in ${totalElapsed}ms`);
          return msg;
        }
      }

      const totalElapsed = Date.now() - overallStart;
      writeLog('ultraverbose', 'airplaneModeService: all attempts failed — full report', {
        scheduleId: ctx?.scheduleId,
        scheduleName: ctx?.scheduleName,
        attempts,
        totalElapsedMs: totalElapsed,
        maxAttempts: MAX_ATTEMPTS,
      });
      writeLog('error', `airplaneModeService: Failed to enable airplane mode after ${MAX_ATTEMPTS} attempts (${totalElapsed}ms)`);
      throw new Error(`Airplane mode enable failed after ${MAX_ATTEMPTS} attempts`);
    } finally {
      this.isExecuting = false;
    }
  }

  async disable(_ctx?: EnableContext): Promise<string> {
    if (this.isExecuting) {
      writeLog('verbose', 'airplaneModeService: Disable already in progress, skipping');
      return 'Already executing';
    }

    this.isExecuting = true;
    const startTime = Date.now();

    try {
      writeLog('info', 'airplaneModeService: Creating new disable instance');

      const isCurrentlyEnabled = await robotService.getAirplaneModeState();
      if (!isCurrentlyEnabled) {
        writeLog('info', 'airplaneModeService: Airplane mode already disabled, skipping');
        return 'Already disabled';
      }

      writeLog('info', 'airplaneModeService: Current state ON, triggering disable');

      const result = await robotService.disableAirplaneMode();

      const elapsed = Date.now() - startTime;
      writeLog('info', `airplaneModeService: Disable completed in ${elapsed}ms: ${result}`);

      return result;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      const elapsed = Date.now() - startTime;
      writeLog('error', `airplaneModeService: Disable failed after ${elapsed}ms: ${msg}`);
      throw err;
    } finally {
      this.isExecuting = false;
    }
  }

  async getState(): Promise<boolean> {
    try {
      return await robotService.getAirplaneModeState();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      writeLog('error', `airplaneModeService: getState failed: ${msg}`);
      return false;
    }
  }
}

export const airplaneModeService = new AirplaneModeService();
