import { robotService } from './robotService';
import { writeLog } from './logService';
import { useAirplaneLearningStore } from '@/store/airplaneLearningStore';

/**
 * Airplane mode operations with learning mode feedback and validation.
 */

export interface EnableContext {
  scheduleId?: string;
  scheduleName?: string;
}

const MAX_ATTEMPTS = 3;
const RETRY_DELAYS_MS = [0, 3000, 5000];
const VALIDATION_WAIT_MS = 2500;

let feedbackResolver: ((confirmed: boolean) => void) | null = null;

export function provideFeedback(confirmed: boolean): void {
  feedbackResolver?.(confirmed);
  feedbackResolver = null;
}

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
    const store = useAirplaneLearningStore.getState();
    const { learned, learnedDelay, isLearning } = store;

    writeLog('ultraverbose', 'airplaneModeService.enable() called', {
      learned,
      learnedDelay,
      isLearning,
      scheduleId: ctx?.scheduleId,
      scheduleName: ctx?.scheduleName,
    });

    try {
      // Branch A: learned sequence — use saved delay, skip validation
      if (learned && !isLearning) {
        writeLog('ultraverbose', 'airplaneModeService: Branch A (learned mode) - applying learned delay', { learnedDelay });
        await this.delay(learnedDelay);
        const msg = await robotService.enableAirplaneMode();
        writeLog('info', `airplaneModeService: used learned delay ${learnedDelay}ms`);
        writeLog('ultraverbose', 'airplaneModeService: Branch A completed successfully', { msg });
        return msg;
      }

      // Branch B: learning mode — retry with user feedback
      if (isLearning) {
        writeLog('ultraverbose', 'airplaneModeService: Branch B (learning mode) - entering retry loop with feedback');
        for (let i = 0; i < MAX_ATTEMPTS; i++) {
          writeLog('ultraverbose', `airplaneModeService: learning mode attempt ${i + 1}/${MAX_ATTEMPTS}`, { attempt: i + 1 });
          if (i > 0) {
            const delayMs = RETRY_DELAYS_MS[i];
            writeLog('ultraverbose', `airplaneModeService: waiting ${delayMs}ms before attempt ${i + 1}`);
            await this.delay(delayMs);
          }

          let msg = '';
          try {
            writeLog('ultraverbose', `airplaneModeService: calling robotService.enableAirplaneMode() for attempt ${i + 1}`);
            msg = await robotService.enableAirplaneMode();
            writeLog('ultraverbose', `airplaneModeService: robotService.enableAirplaneMode() returned: ${msg}`);
            writeLog('ultraverbose', `airplaneModeService: waiting ${VALIDATION_WAIT_MS}ms before requesting feedback`);
            await this.delay(VALIDATION_WAIT_MS);
          } catch (err: unknown) {
            writeLog('error', `airplaneModeService: enableAirplaneMode attempt ${i + 1} failed: ${String(err)}`);
            if (i === MAX_ATTEMPTS - 1) throw err;
            continue;
          }

          // Show feedback prompt
          writeLog('ultraverbose', `airplaneModeService: setting pendingFeedback for attempt ${i + 1}`, { attempt: i + 1 });
          store.setPendingFeedback(i + 1);
          writeLog('ultraverbose', `airplaneModeService: waiting for user feedback on attempt ${i + 1}`);
          const confirmed: boolean = await new Promise(resolve => {
            feedbackResolver = resolve;
          });
          writeLog('ultraverbose', `airplaneModeService: user feedback received: ${confirmed}`, { attempt: i + 1, confirmed });
          store.clearPendingFeedback();

          if (confirmed) {
            store.saveLearned(RETRY_DELAYS_MS[i]);
            writeLog('info', `airplaneModeService: learning confirmed on attempt ${i + 1}, delay=${RETRY_DELAYS_MS[i]}ms`);
            writeLog('ultraverbose', 'airplaneModeService: Branch B completed with confirmation', { confirmedAttempt: i + 1, delay: RETRY_DELAYS_MS[i] });
            return msg;
          }
          writeLog('ultraverbose', `airplaneModeService: user denied attempt ${i + 1}, continuing to next attempt`);
        }

        writeLog('error', 'airplaneModeService: Learning mode exhausted all attempts, user did not confirm any');
        throw new Error('No confirmed attempt in learning mode');
      }

      // Branch C: standard retry with validation (default behavior)
      writeLog('ultraverbose', 'airplaneModeService: Branch C (default retry mode) - entering retry loop with state validation');
      const overallStart = Date.now();
      const attempts: AttemptRecord[] = [];

      for (let i = 0; i < MAX_ATTEMPTS; i++) {
        writeLog('ultraverbose', `airplaneModeService: Branch C attempt ${i + 1}/${MAX_ATTEMPTS}`, { attempt: i + 1 });
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
      writeLog('ultraverbose', 'airplaneModeService.enable() exiting', { isExecuting: true });
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
