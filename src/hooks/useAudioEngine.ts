import { useState, useEffect, useRef, useCallback } from 'react';
import MetronomeEngine from '../audio/MetronomeEngine';
import InputAnalyzer from '../audio/InputAnalyzer';
import LatencyCalibrator from '../audio/LatencyCalibrator';
import type { TimingEvent, AccuracyMetrics, CalibrationResult } from '../types';

export function useAudioEngine() {
    const [isPlaying, setIsPlaying] = useState(false);
    const [bpm, setBpm] = useState(120);
    const [currentBeat, setCurrentBeat] = useState(0);
    const [isInitialized, setIsInitialized] = useState(false);
    const [accuracyMetrics, setAccuracyMetrics] = useState<AccuracyMetrics>({
        averageOffset: 0,
        recentHits: [],
        perfectHits: 0,
        totalHits: 0
    });
    const [systemLatency, setSystemLatency] = useState(0);
    const [isCalibrating, setIsCalibrating] = useState(false);

    const metronomeRef = useRef<MetronomeEngine | null>(null);
    const inputAnalyzerRef = useRef<InputAnalyzer | null>(null);
    const calibratorRef = useRef<LatencyCalibrator | null>(null);
    const beatTimesRef = useRef<Map<number, number>>(new Map());
    const nextBeatIndexRef = useRef(0);

    // Initialize audio engine
    useEffect(() => {
        const initAudio = async () => {
            try {
                // Create metronome
                const metronome = new MetronomeEngine();
                metronome.setBPM(bpm);
                metronome.setCallback((beat, time) => {
                    setCurrentBeat(beat);

                    // Store beat time for offset calculation
                    const beatIndex = nextBeatIndexRef.current++;
                    beatTimesRef.current.set(beatIndex, time);

                    // Notify input analyzer of click
                    if (inputAnalyzerRef.current) {
                        inputAnalyzerRef.current.notifyClick(time);
                    }

                    // Clean up old beat times (keep last 100)
                    if (beatTimesRef.current.size > 100) {
                        const oldestKey = Math.min(...Array.from(beatTimesRef.current.keys()));
                        beatTimesRef.current.delete(oldestKey);
                    }
                });
                metronomeRef.current = metronome;

                // Create input analyzer
                const analyzer = new InputAnalyzer();
                await analyzer.initialize();
                analyzer.setClickFrequency(metronome.getClickFrequency());
                analyzer.setTransientCallback((event: TimingEvent) => {
                    handleTransient(event);
                });
                inputAnalyzerRef.current = analyzer;

                // Create calibrator
                const calibrator = new LatencyCalibrator(analyzer);
                calibratorRef.current = calibrator;

                setIsInitialized(true);
            } catch (error) {
                console.error('Failed to initialize audio:', error);
            }
        };

        initAudio();

        return () => {
            if (metronomeRef.current) {
                metronomeRef.current.stop();
            }
            if (inputAnalyzerRef.current) {
                inputAnalyzerRef.current.cleanup();
            }
        };
    }, []);

    const handleTransient = useCallback((event: TimingEvent) => {
        // Find the closest beat
        const eventTimeInAudioContext = event.timestamp / 1000; // Convert to seconds
        let closestBeatTime = 0;
        let minDiff = Infinity;

        beatTimesRef.current.forEach((beatTime) => {
            const diff = Math.abs(eventTimeInAudioContext - beatTime);
            if (diff < minDiff) {
                minDiff = diff;
                closestBeatTime = beatTime;
            }
        });

        if (closestBeatTime > 0) {
            const offsetMs = (eventTimeInAudioContext - closestBeatTime) * 1000;
            const updatedEvent = { ...event, offset: offsetMs };

            setAccuracyMetrics(prev => {
                const newRecentHits = [...prev.recentHits, updatedEvent].slice(-20); // Keep last 20 hits
                const avgOffset = newRecentHits.reduce((sum, hit) => sum + hit.offset, 0) / newRecentHits.length;
                const perfectHits = prev.perfectHits + (Math.abs(offsetMs) < 10 ? 1 : 0);
                const totalHits = prev.totalHits + 1;

                return {
                    averageOffset: avgOffset,
                    recentHits: newRecentHits,
                    perfectHits,
                    totalHits
                };
            });
        }
    }, []);

    const togglePlay = useCallback(() => {
        if (!metronomeRef.current || !inputAnalyzerRef.current) return;

        if (isPlaying) {
            metronomeRef.current.stop();
            inputAnalyzerRef.current.stopAnalyzing();
            setIsPlaying(false);
        } else {
            metronomeRef.current.start();
            inputAnalyzerRef.current.startAnalyzing();
            setIsPlaying(true);
        }
    }, [isPlaying]);

    const updateBpm = useCallback((newBpm: number) => {
        setBpm(newBpm);
        if (metronomeRef.current) {
            metronomeRef.current.setBPM(newBpm);
        }
    }, []);

    const calibrateLatency = useCallback(async (): Promise<CalibrationResult | null> => {
        if (!calibratorRef.current || !inputAnalyzerRef.current) return null;

        setIsCalibrating(true);
        try {
            const result = await calibratorRef.current.calibrate(5);
            setSystemLatency(result.latency);
            inputAnalyzerRef.current.setSystemLatency(result.latency);
            return result;
        } catch (error) {
            console.error('Calibration failed:', error);
            return null;
        } finally {
            setIsCalibrating(false);
        }
    }, []);

    const resetMetrics = useCallback(() => {
        setAccuracyMetrics({
            averageOffset: 0,
            recentHits: [],
            perfectHits: 0,
            totalHits: 0
        });
    }, []);

    return {
        isPlaying,
        bpm,
        currentBeat,
        isInitialized,
        accuracyMetrics,
        systemLatency,
        isCalibrating,
        togglePlay,
        updateBpm,
        calibrateLatency,
        resetMetrics
    };
}
