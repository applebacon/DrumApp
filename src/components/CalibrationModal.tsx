import { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import type { CalibrationResult } from '../types';

interface CalibrationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCalibrate: () => Promise<CalibrationResult | null>;
}

export default function CalibrationModal({ isOpen, onClose, onCalibrate }: CalibrationModalProps) {
    const [isCalibrating, setIsCalibrating] = useState(false);
    const [result, setResult] = useState<CalibrationResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleCalibrate = async () => {
        setIsCalibrating(true);
        setError(null);
        setResult(null);

        try {
            const calibrationResult = await onCalibrate();
            if (calibrationResult) {
                setResult(calibrationResult);
            } else {
                setError('Calibration failed. Please ensure your microphone is near the speaker.');
            }
        } catch (err) {
            setError('An error occurred during calibration.');
        } finally {
            setIsCalibrating(false);
        }
    };

    const handleClose = () => {
        setResult(null);
        setError(null);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="glass rounded-2xl p-8 max-w-md w-full relative">
                <button
                    onClick={handleClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-white transition-smooth"
                >
                    <X size={24} />
                </button>

                <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                    Latency Calibration
                </h2>

                <div className="space-y-4 mb-6">
                    <p className="text-gray-300">
                        Calibration measures the round-trip latency between your speakers and microphone.
                    </p>

                    <div className="bg-yellow-500 bg-opacity-10 border border-yellow-500 border-opacity-30 rounded-lg p-4">
                        <p className="text-yellow-200 text-sm">
                            <strong>Important:</strong> Place your microphone near your speaker for accurate results.
                            The app will play 5 test beeps.
                        </p>
                    </div>
                </div>

                {!result && !error && (
                    <button
                        onClick={handleCalibrate}
                        disabled={isCalibrating}
                        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 disabled:from-gray-700 disabled:to-gray-700 text-white font-semibold py-4 px-6 rounded-xl transition-smooth glow disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isCalibrating ? (
                            <>
                                <Loader2 size={20} className="animate-spin" />
                                <span>Calibrating...</span>
                            </>
                        ) : (
                            <span>Start Calibration</span>
                        )}
                    </button>
                )}

                {result && (
                    <div className="space-y-4">
                        <div className="bg-green-500 bg-opacity-10 border border-green-500 border-opacity-30 rounded-lg p-4">
                            <div className="text-center">
                                <div className="text-sm text-green-200 mb-2">Calibration Complete</div>
                                <div className="text-3xl font-bold text-green-400">
                                    {result.latency.toFixed(1)} ms
                                </div>
                                <div className="text-xs text-green-300 mt-2">
                                    Confidence: {(result.confidence * 100).toFixed(0)}%
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handleClose}
                            className="w-full bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-xl transition-smooth"
                        >
                            Done
                        </button>
                    </div>
                )}

                {error && (
                    <div className="space-y-4">
                        <div className="bg-red-500 bg-opacity-10 border border-red-500 border-opacity-30 rounded-lg p-4">
                            <p className="text-red-200 text-sm">{error}</p>
                        </div>

                        <button
                            onClick={handleCalibrate}
                            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-semibold py-3 px-6 rounded-xl transition-smooth"
                        >
                            Try Again
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}