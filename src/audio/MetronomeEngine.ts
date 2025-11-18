import AudioContextManager from './AudioContextManager';

export type MetronomeCallback = (beat: number, time: number) => void;

class MetronomeEngine {
    private audioManager: AudioContextManager;
    private isPlaying: boolean = false;
    private bpm: number = 120;
    private timeSignature: { beats: number; noteValue: number } = { beats: 4, noteValue: 4 };
    private currentBeat: number = 0;
    private nextNoteTime: number = 0;
    private scheduleAheadTime: number = 0.1; // seconds
    private lookahead: number = 25; // ms
    private timerID: number | null = null;
    private callback: MetronomeCallback | null = null;

    // Click sound parameters
    private clickFrequency: number = 1000; // Hz
    private accentFrequency: number = 1200; // Hz for first beat

    constructor() {
        this.audioManager = AudioContextManager.getInstance();
    }

    setBPM(bpm: number): void {
        this.bpm = Math.max(30, Math.min(300, bpm));
    }

    setTimeSignature(beats: number, noteValue: number): void {
        this.timeSignature = { beats, noteValue };
    }

    setCallback(callback: MetronomeCallback): void {
        this.callback = callback;
    }

    start(): void {
        if (this.isPlaying) return;

        this.isPlaying = true;
        this.currentBeat = 0;
        this.nextNoteTime = this.audioManager.getCurrentTime();
        this.scheduler();
    }

    stop(): void {
        this.isPlaying = false;
        if (this.timerID !== null) {
            clearTimeout(this.timerID);
            this.timerID = null;
        }
    }

    private scheduler(): void {
        // Schedule notes while we're ahead of time
        while (this.nextNoteTime < this.audioManager.getCurrentTime() + this.scheduleAheadTime) {
            this.scheduleNote(this.currentBeat, this.nextNoteTime);
            this.nextNote();
        }

        if (this.isPlaying) {
            this.timerID = window.setTimeout(() => this.scheduler(), this.lookahead);
        }
    }

    private scheduleNote(beatNumber: number, time: number): void {
        // Create click sound
        const ctx = this.audioManager.getContext();
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();

        // First beat is accented
        osc.frequency.value = beatNumber === 0 ? this.accentFrequency : this.clickFrequency;

        gainNode.gain.value = 0.3;
        gainNode.gain.exponentialRampToValueAtTime(0.01, time + 0.05);

        osc.connect(gainNode);
        gainNode.connect(ctx.destination);

        osc.start(time);
        osc.stop(time + 0.05);

        // Notify callback
        if (this.callback) {
            this.callback(beatNumber, time);
        }
    }

    private nextNote(): void {
        // Calculate next note time
        const secondsPerBeat = 60.0 / this.bpm;
        this.nextNoteTime += secondsPerBeat;

        // Advance beat
        this.currentBeat = (this.currentBeat + 1) % this.timeSignature.beats;
    }

    getClickFrequency(): number {
        return this.clickFrequency;
    }

    getAccentFrequency(): number {
        return this.accentFrequency;
    }

    getBPM(): number {
        return this.bpm;
    }

    getIsPlaying(): boolean {
        return this.isPlaying;
    }

    getCurrentBeat(): number {
        return this.currentBeat;
    }
}

export default MetronomeEngine;
