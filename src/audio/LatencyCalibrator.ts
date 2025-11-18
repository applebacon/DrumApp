import AudioContextManager from './AudioContextManager';
import InputAnalyzer from './InputAnalyzer';
import type { CalibrationResult } from '../types';

class LatencyCalibrator {
    private audioManager: AudioContextManager;
    private inputAnalyzer: InputAnalyzer;
    private calibrationAttempts: number[] = [];
    private isCalibrating: boolean = false;
    private pulseFrequency: number = 2000; // Hz, different from click
    private pulseDuration: number = 0.05; // seconds

    constructor(inputAnalyzer: InputAnalyzer) {
        this.audioManager = AudioContextManager.getInstance();
        this.inputAnalyzer = inputAnalyzer;
    }

    async calibrate(numAttempts: number = 5): Promise<CalibrationResult> {
        if (this.isCalibrating) {
            throw new Error('Calibration already in progress');
        }

        this.isCalibrating = true;
        this.calibrationAttempts = [];

        try {
            for (let i = 0; i < numAttempts; i++) {
                const latency = await this.singleCalibrationAttempt();
                if (latency !== null) {
                    this.calibrationAttempts.push(latency);
                }

                // Wait between attempts
                if (i < numAttempts - 1) {
                    await this.delay(500);
                }
            }

            if (this.calibrationAttempts.length === 0) {
                throw new Error('No successful calibration attempts');
            }

            // Calculate average and confidence
            const average = this.calibrationAttempts.reduce((a, b) => a + b, 0) / this.calibrationAttempts.length;
            const variance = this.calibrationAttempts.reduce((sum, val) => sum + Math.pow(val - average, 2), 0) / this.calibrationAttempts.length;
            const stdDev = Math.sqrt(variance);

            // Confidence is higher when standard deviation is lower
            const confidence = Math.max(0, Math.min(1, 1 - (stdDev / 50)));

            return {
                latency: average,
                confidence
            };
        } finally {
            this.isCalibrating = false;
        }
    }

    private async singleCalibrationAttempt(): Promise<number | null> {
        return new Promise((resolve) => {
            const startTime = performance.now();
            let resolved = false;

            // Ensure analyzer is running
            const wasAnalyzing = this.inputAnalyzer['isAnalyzing'];
            if (!wasAnalyzing) {
                this.inputAnalyzer.startAnalyzing();
            }

            // Set up listener for the pulse echo
            const originalCallback = this.inputAnalyzer['transientCallback'];
            const tempCallback = () => {
                if (!resolved) {
                    resolved = true;
                    const endTime = performance.now();
                    const latency = endTime - startTime;

                    // Restore original callback
                    if (originalCallback) {
                        this.inputAnalyzer.setTransientCallback(originalCallback);
                    }

                    // Restore analyzer state
                    if (!wasAnalyzing) {
                        this.inputAnalyzer.stopAnalyzing();
                    }

                    resolve(latency);
                }
            };

            this.inputAnalyzer.setTransientCallback(tempCallback);

            // Emit calibration pulse after a short delay to ensure listener is ready
            setTimeout(() => {
                this.emitPulse();
            }, 100);

            // Timeout after 1 second
            setTimeout(() => {
                if (!resolved) {
                    resolved = true;
                    if (originalCallback) {
                        this.inputAnalyzer.setTransientCallback(originalCallback);
                    }

                    // Restore analyzer state
                    if (!wasAnalyzing) {
                        this.inputAnalyzer.stopAnalyzing();
                    }

                    console.warn('Calibration attempt timed out - no pulse detected');
                    resolve(null);
                }
            }, 1000);
        });
    }

    private emitPulse(): void {
        const ctx = this.audioManager.getContext();
        const now = ctx.currentTime;

        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();

        osc.frequency.value = this.pulseFrequency;
        gainNode.gain.value = 0.5;
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + this.pulseDuration);

        osc.connect(gainNode);
        gainNode.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + this.pulseDuration);
    }

    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    getIsCalibrating(): boolean {
        return this.isCalibrating;
    }
}

export default LatencyCalibrator;
