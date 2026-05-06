import { robotService } from './robotService';
import { writeLog } from './logService';
import { useWeaLearningStore } from '@/store/weaLearningStore';

const MAX_ATTEMPTS = 3;
const RETRY_DELAYS_MS = [0, 3000, 5000];
const POST_SILENCE_WAIT_MS = 2500;

let feedbackResolver: ((confirmed: boolean) => void) | null = null;

export function provideWeaFeedback(confirmed: boolean): void {
  feedbackResolver?.(confirmed);
  feedbackResolver = null;
}

class WeaSilenceService {
  private isExecuting = false;

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async silence(): Promise<string> {
    if (this.isExecuting) {
      writeLog('verbose', 'weaSilenceService: Silence already in progress, skipping');
      return 'Already executing';
    }

    this.isExecuting = true;
    const store = useWeaLearningStore.getState();
    const { learned, learnedDelay, isLearning } = store;

    writeLog('ultraverbose', 'weaSilenceService.silence() called', {
      learned,
      learnedDelay,
      isLearning,
    });

    try {
      // Branch A: learned sequence — use saved delay, skip retry
      if (learned && !isLearning) {
        writeLog('ultraverbose', 'weaSilenceService: Branch A (learned mode) - applying learned delay', { learnedDelay });
        await this.delay(learnedDelay);
        const msg = await robotService.silenceWEA();
        writeLog('info', `weaSilenceService: used learned delay ${learnedDelay}ms`);
        writeLog('ultraverbose', 'weaSilenceService: Branch A completed successfully', { msg });
        return msg;
      }

      // Branch B: learning mode — retry with user feedback
      if (isLearning) {
        writeLog('ultraverbose', 'weaSilenceService: Branch B (learning mode) - entering retry loop with feedback');
        for (let i = 0; i < MAX_ATTEMPTS; i++) {
          writeLog('ultraverbose', `weaSilenceService: learning mode attempt ${i + 1}/${MAX_ATTEMPTS}`, { attempt: i + 1 });
          if (i > 0) {
            const delayMs = RETRY_DELAYS_MS[i];
            writeLog('ultraverbose', `weaSilenceService: waiting ${delayMs}ms before attempt ${i + 1}`);
            await this.delay(delayMs);
          }

          let msg = '';
          let attemptError: string | undefined;
          try {
            writeLog('ultraverbose', `weaSilenceService: calling robotService.silenceWEA() for attempt ${i + 1}`);
            msg = await robotService.silenceWEA();
            writeLog('ultraverbose', `weaSilenceService: robotService.silenceWEA() returned: ${msg}`);
          } catch (err: unknown) {
            attemptError = String(err);
            writeLog('error', `weaSilenceService: silenceWEA attempt ${i + 1} failed: ${attemptError}`);
            msg = 'Operation failed (see logs)';
          }

          writeLog('ultraverbose', `weaSilenceService: waiting ${POST_SILENCE_WAIT_MS}ms before requesting feedback`);
          await this.delay(POST_SILENCE_WAIT_MS);

          // Show feedback prompt (even if operation failed — user might confirm it worked anyway)
          writeLog('ultraverbose', `weaSilenceService: setting pendingFeedback for attempt ${i + 1}`, { attempt: i + 1 });
          store.setPendingFeedback(i + 1);
          writeLog('ultraverbose', `weaSilenceService: waiting for user feedback on attempt ${i + 1}`);
          const confirmed: boolean = await new Promise(resolve => {
            feedbackResolver = resolve;
          });
          writeLog('ultraverbose', `weaSilenceService: user feedback received: ${confirmed}`, { attempt: i + 1, confirmed });
          store.clearPendingFeedback();

          if (confirmed) {
            store.saveLearned(RETRY_DELAYS_MS[i]);
            writeLog('info', `weaSilenceService: learning confirmed on attempt ${i + 1}, delay=${RETRY_DELAYS_MS[i]}ms`);
            writeLog('ultraverbose', 'weaSilenceService: Branch B completed with confirmation', { confirmedAttempt: i + 1, delay: RETRY_DELAYS_MS[i] });
            return msg;
          }
          writeLog('ultraverbose', `weaSilenceService: user denied attempt ${i + 1}, continuing to next attempt`);
        }

        writeLog('error', 'weaSilenceService: Learning mode exhausted all attempts, user did not confirm any');
        throw new Error('No confirmed attempt in learning mode');
      }

      // Branch C: default (no learning, not learned) — call once and return
      writeLog('ultraverbose', 'weaSilenceService: Branch C (default mode) - calling silenceWEA once');
      const msg = await robotService.silenceWEA();
      writeLog('ultraverbose', 'weaSilenceService: Branch C completed successfully', { msg });
      return msg;
    } finally {
      writeLog('ultraverbose', 'weaSilenceService.silence() exiting', { isExecuting: true });
      this.isExecuting = false;
    }
  }
}

export const weaSilenceService = new WeaSilenceService();
