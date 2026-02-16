/**
 * Success Audio Feedback Utility
 * Plays a WAV file on successful product/category addition to cart or creation.
 * Separate from ScannerAudio which uses oscillator-generated beeps for POS scanning.
 *
 * Uses Vite asset import so the path resolves correctly in both
 * dev-server (URL) and production (file://) Electron modes.
 */

import { getLogger } from "@/shared/utils/logger";
import successBeepUrl from "@/assets/sounds/success-beep.wav";

const logger = getLogger("success-audio");

export class SuccessAudio {
  private static audio: HTMLAudioElement | null = null;
  private static isEnabled = true;

  /**
   * Pre-load the audio to avoid latency on first play.
   * Safe to call multiple times -- only loads once.
   */
  static preload(): void {
    if (this.audio) return;
    try {
      this.audio = new Audio(successBeepUrl);
      this.audio.preload = "auto";
      this.audio.volume = 0.5;
    } catch (error) {
      logger.warn("Failed to preload success audio:", error);
    }
  }

  /**
   * Play the success beep once.
   * Resets playback position so rapid successive calls each produce sound.
   */
  static async play(): Promise<void> {
    if (!this.isEnabled) return;
    try {
      this.preload();
      if (!this.audio) return;
      this.audio.currentTime = 0;
      await this.audio.play();
    } catch (error) {
      logger.warn("Failed to play success sound:", error);
    }
  }

  static setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  static getEnabled(): boolean {
    return this.isEnabled;
  }
}
