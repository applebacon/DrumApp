import { Settings } from 'lucide-react';
import type { AccuracyMetrics } from '../types';

interface TimingDisplayProps {
    metrics: AccuracyMetrics;
    systemLatency: number;
    isCalibrating: boolean;
    onCalibrate: () => void;
    disabled?: boolean;
}

export default function TimingDisplay({
    metrics,
    systemLatency,
    isCalibrating,
    onCalibrate,
    disabled = false
}: TimingDisplayProps) {
    const accuracy = metrics.totalHits > 0
        ? (metrics.perfectHits / metrics.totalHits) * 100
        : 0;

    return (
        <div className="glass rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-300">Statistics</h2>

                <button
                    onClick={onCalibrate}
                    disabled={disabled || isCalibrating}
                    className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 disabled:bg-gray-700 text-white text-sm font-semibold py-2 px-4 rounded-lg transition-smooth disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Settings size={16} />
                    <span>{isCalibrating ? 'Calibrating...' : 'Calibrate Latency'}</span>
                </button>
            </div>

            {systemLatency > 0 && (
                <div className="mb-4 p-3 bg-green-500 bg-opacity-10 border border-green-500 border-opacity-30 rounded-lg">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-green-200">System Latency Calibrated</span>
                        <span className="text-lg font-bold text-green-400">{systemLatency.toFixed(1)} ms</span>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-2 gap-6">
                {/* Average Offset */}
                <div className="text-center">
                    <div className="text-sm text-gray-400 mb-2 uppercase tracking-wide">Avg Offset</div>
                    <div className={`text-3xl font-bold ${Math.abs(metrics.averageOffset) < 5
                        ? 'text-green-400'
                        : Math.abs(metrics.averageOffset) < 15
                            ? 'text-yellow-400'
                            : 'text-red-400'
                        }`}>
                        {metrics.averageOffset >= 0 ? '+' : ''}{metrics.averageOffset.toFixed(1)}
                        <span className="text-lg ml-1">ms</span>
                    </div>
                </div>

                {/* Accuracy */}
                <div className="text-center">
                    <div className="text-sm text-gray-400 mb-2 uppercase tracking-wide">Accuracy</div>
                    <div className={`text-3xl font-bold ${accuracy >= 80
                        ? 'text-green-400'
                        : accuracy >= 60
                            ? 'text-yellow-400'
                            : 'text-red-400'
                        }`}>
                        {accuracy.toFixed(0)}
                        <span className="text-lg ml-1">%</span>
                    </div>
                </div>

                {/* Total Hits */}
                <div className="text-center">
                    <div className="text-sm text-gray-400 mb-2 uppercase tracking-wide">Total Hits</div>
                    <div className="text-3xl font-bold text-purple-400">
                        {metrics.totalHits}
                    </div>
                </div>

                {/* Perfect Hits */}
                <div className="text-center">
                    <div className="text-sm text-gray-400 mb-2 uppercase tracking-wide">Perfect</div>
                    <div className="text-3xl font-bold text-blue-400">
                        {metrics.perfectHits}
                    </div>
                </div>
            </div>

            {/* Recent Hits Indicator */}
            {metrics.recentHits.length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-700">
                    <div className="text-xs text-gray-400 mb-3 uppercase tracking-wide">Last 10 Hits</div>
                    <div className="flex gap-1">
                        {metrics.recentHits.slice(-10).map((hit, index) => {
                            const isPerfect = Math.abs(hit.offset) < 10;
                            const isGood = Math.abs(hit.offset) < 20;

                            return (
                                <div
                                    key={index}
                                    className={`flex-1 h-2 rounded-full transition-smooth ${isPerfect
                                        ? 'bg-green-500'
                                        : isGood
                                            ? 'bg-yellow-500'
                                            : 'bg-red-500'
                                        }`}
                                    title={`${hit.offset.toFixed(1)}ms`}
                                />
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
