import { robotService } from './robotService';
import { writeLog } from './logService';

/**
 * Dedicated service for airplane mode operations.
 * Creates a new instance for each operation to ensure proper state management
 * and reliable robot automation triggering.
 */
class AirplaneModeService {
  private isExecuting = false;

  /**
   * Enable airplane mode via robot automation
   * Creates a fresh instance to trigger the robot component
   */
  async enable(): Promise<string> {
    if (this.isExecuting) {
      writeLog('verbose', 'airplaneModeService: Enable already in progress, skipping');
      return 'Already executing';
    }

    this.isExecuting = true;
    const startTime = Date.now();

    try {
      writeLog('info', 'airplaneModeService: Creating new enable instance');

      // Check current state first
      const isCurrentlyEnabled = await robotService.getAirplaneModeState();
      if (isCurrentlyEnabled) {
        writeLog('info', 'airplaneModeService: Airplane mode already enabled, skipping');
        return 'Already enabled';
      }

      writeLog('info', 'airplaneModeService: Current state OFF, triggering enable');

      // Create new instance and execute
      const result = await robotService.enableAirplaneMode();

      const elapsed = Date.now() - startTime;
      writeLog('info', `airplaneModeService: Enable completed in ${elapsed}ms: ${result}`);

      return result;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      const elapsed = Date.now() - startTime;
      writeLog('error', `airplaneModeService: Enable failed after ${elapsed}ms: ${msg}`);
      throw err;
    } finally {
      this.isExecuting = false;
    }
  }

  /**
   * Disable airplane mode via robot automation
   * Creates a fresh instance to trigger the robot component
   */
  async disable(): Promise<string> {
    if (this.isExecuting) {
      writeLog('verbose', 'airplaneModeService: Disable already in progress, skipping');
      return 'Already executing';
    }

    this.isExecuting = true;
    const startTime = Date.now();

    try {
      writeLog('info', 'airplaneModeService: Creating new disable instance');

      // Check current state first
      const isCurrentlyEnabled = await robotService.getAirplaneModeState();
      if (!isCurrentlyEnabled) {
        writeLog('info', 'airplaneModeService: Airplane mode already disabled, skipping');
        return 'Already disabled';
      }

      writeLog('info', 'airplaneModeService: Current state ON, triggering disable');

      // Create new instance and execute
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

  /**
   * Get current airplane mode state
   */
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

// Export singleton instance
export const airplaneModeService = new AirplaneModeService();
