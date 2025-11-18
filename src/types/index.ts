// Type definitions for the drum app

export interface TimingEvent {
  timestamp: number;
  offset: number; // ms offset from grid
  amplitude: number;
}

export interface MetronomeState {
  isPlaying: boolean;
  bpm: number;
  timeSignature: {
    beats: number;
    noteValue: number;
  };
  currentBeat: number;
}

export interface CalibrationResult {
  latency: number; // ms
  confidence: number; // 0-1
}

export interface AccuracyMetrics {
  averageOffset: number; // ms, negative = rushing, positive = dragging
  recentHits: TimingEvent[];
  perfectHits: number;
  totalHits: number;
}
