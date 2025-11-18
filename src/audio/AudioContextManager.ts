// Singleton AudioContext Manager
class AudioContextManager {
    private static instance: AudioContextManager;
    private audioContext: AudioContext | null = null;

    private constructor() { }

    static getInstance(): AudioContextManager {
        if (!AudioContextManager.instance) {
            AudioContextManager.instance = new AudioContextManager();
        }
        return AudioContextManager.instance;
    }

    getContext(): AudioContext {
        if (!this.audioContext) {
            this.audioContext = new AudioContext();
        }

        // Resume context if suspended (browser autoplay policy)
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }

        return this.audioContext;
    }

    getCurrentTime(): number {
        return this.getContext().currentTime;
    }

    async resumeContext(): Promise<void> {
        const ctx = this.getContext();
        if (ctx.state === 'suspended') {
            await ctx.resume();
        }
    }
}

export default AudioContextManager;
