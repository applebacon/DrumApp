import AudioContextManager from './AudioContextManager';
import type { TimingEvent } from '../types';

export type TransientCallback = (event: TimingEvent) => void;

class InputAnalyzer {
    private audioManager: AudioContextManager;
    private mediaStream: MediaStream | null = null;
    private analyserNode: AnalyserNode | null = null;
    private sourceNode: MediaStreamAudioSourceNode | null = null;
    private highPassFilter: BiquadFilterNode | null = null;
    private notchFilter: BiquadFilterNode | null = null;

    private dataArray: Uint8Array | null = null;
    private previousAmplitude: number = 0;
    private threshold: number = 30; // Amplitude threshold for transient detection
    private transientCallback: TransientCallback | null = null;
    private isAnalyzing: boolean = false;
    private animationFrameId: number | null = null;

    // Timing tracking
    private lastTransientTime: number = 0;
    private minTimeBetweenHits: number = 50; // ms, debounce
    private systemLatency: number = 0; // ms, from calibration
    private clickFrequency: number = 1000; // Hz, to filter out
    private clickWindowMs: number = 30; // ms, blind window around click

    private lastClickTime: number = 0;

    constructor() {
        this.audioManager = AudioContextManager.getInstance();
    }

    async initialize(): Promise<void> {
        try {
            this.mediaStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: false,
                    noiseSuppression: false,
                    autoGainControl: false
                }
            });

            const ctx = this.audioManager.getContext();
            this.sourceNode = ctx.createMediaStreamSource(this.mediaStream);

            // Create high-pass filter to remove low-frequency rumble
            this.highPassFilter = ctx.createBiquadFilter();
            this.highPassFilter.type = 'highpass';
            this.highPassFilter.frequency.value = 80; // Hz
            this.highPassFilter.Q.value = 1;

            // Create notch filter to remove click frequency
            this.notchFilter = ctx.createBiquadFilter();
            this.notchFilter.type = 'notch';
            this.notchFilter.frequency.value = this.clickFrequency;
            this.notchFilter.Q.value = 10; // Narrow notch

            // Create analyser
            this.analyserNode = ctx.createAnalyser();
            this.analyserNode.fftSize = 2048;
            this.analyserNode.smoothingTimeConstant = 0;

            // Connect nodes
            this.sourceNode
                .connect(this.highPassFilter)
                .connect(this.notchFilter)
                .connect(this.analyserNode);

            this.dataArray = new Uint8Array(this.analyserNode.frequencyBinCount);
        } catch (error) {
            console.error('Failed to initialize microphone:', error);
            throw error;
        }
    }

    setTransientCallback(callback: TransientCallback): void {
        this.transientCallback = callback;
    }

    setClickFrequency(frequency: number): void {
        this.clickFrequency = frequency;
        if (this.notchFilter) {
            this.notchFilter.frequency.value = frequency;
        }
    }

    setSystemLatency(latency: number): void {
        this.systemLatency = latency;
    }

    notifyClick(time: number): void {
        // Store the time of the metronome click to create a blind window
        this.lastClickTime = time;
    }

    startAnalyzing(): void {
        if (this.isAnalyzing) return;
        this.isAnalyzing = true;
        this.analyze();
    }

    stopAnalyzing(): void {
        this.isAnalyzing = false;
        if (this.animationFrameId !== null) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }

    private analyze(): void {
        if (!this.isAnalyzing || !this.analyserNode || !this.dataArray) return;

        this.analyserNode.getByteTimeDomainData(this.dataArray);

        // Calculate RMS amplitude
        let sum = 0;
        for (let i = 0; i < this.dataArray.length; i++) {
            const normalized = (this.dataArray[i] - 128) / 128;
            sum += normalized * normalized;
        }
        const rms = Math.sqrt(sum / this.dataArray.length) * 100;

        // Detect transient (sharp increase in amplitude)
        const delta = rms - this.previousAmplitude;
        const now = performance.now();

        // Check if we're in the blind window around a click
        const timeSinceClick = (this.audioManager.getCurrentTime() - this.lastClickTime) * 1000;
        const inBlindWindow = timeSinceClick < this.clickWindowMs && timeSinceClick >= 0;

        if (
            delta > this.threshold &&
            now - this.lastTransientTime > this.minTimeBetweenHits &&
            !inBlindWindow
        ) {
            this.lastTransientTime = now;

            if (this.transientCallback) {
                const event: TimingEvent = {
                    timestamp: now - this.systemLatency,
                    offset: 0, // Will be calculated by the consumer
                    amplitude: rms
                };
                this.transientCallback(event);
            }
        }

        this.previousAmplitude = rms;
        this.animationFrameId = requestAnimationFrame(() => this.analyze());
    }

    setThreshold(threshold: number): void {
        this.threshold = threshold;
    }

    getThreshold(): number {
        return this.threshold;
    }

    getCurrentAmplitude(): number {
        if (!this.analyserNode || !this.dataArray) return 0;

        this.analyserNode.getByteTimeDomainData(this.dataArray);
        let sum = 0;
        for (let i = 0; i < this.dataArray.length; i++) {
            const normalized = (this.dataArray[i] - 128) / 128;
            sum += normalized * normalized;
        }
        return Math.sqrt(sum / this.dataArray.length) * 100;
    }

    cleanup(): void {
        this.stopAnalyzing();

        if (this.sourceNode) {
            this.sourceNode.disconnect();
        }
        if (this.mediaStream) {
            this.mediaStream.getTracks().forEach(track => track.stop());
        }
    }
}

export default InputAnalyzer;
