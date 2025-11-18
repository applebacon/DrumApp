import { Play, Pause, RotateCcw } from 'lucide-react';

interface MetronomeControlsProps {
    isPlaying: boolean;
    bpm: number;
    onTogglePlay: () => void;
    onBpmChange: (bpm: number) => void;
    onReset: () => void;
    disabled?: boolean;
}

export default function MetronomeControls({
    isPlaying,
    bpm,
    onTogglePlay,
    onBpmChange,
    onReset,
    disabled = false
}: MetronomeControlsProps) {
    return (
        <div className="glass rounded-2xl p-6 space-y-6">
            <h2 className="text-2xl font-bold text-center bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                Metronome
            </h2>

            {/* BPM Display */}
            <div className="text-center">
                <div className="text-6xl font-bold text-white mb-2">{bpm}</div>
                <div className="text-sm text-gray-400 uppercase tracking-wider">BPM</div>
            </div>

            {/* BPM Slider */}
            <div className="space-y-2">
                <input
                    type="range"
                    min="30"
                    max="300"
                    value={bpm}
                    onChange={(e) => onBpmChange(Number(e.target.value))}
                    disabled={disabled}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                    style={{
                        background: `linear-gradient(to right, rgb(139, 92, 246) 0%, rgb(139, 92, 246) ${((bpm - 30) / 270) * 100}%, rgb(55, 65, 81) ${((bpm - 30) / 270) * 100}%, rgb(55, 65, 81) 100%)`
                    }}
                />
                <div className="flex justify-between text-xs text-gray-500">
                    <span>30</span>
                    <span>165</span>
                    <span>300</span>
                </div>
            </div>

            {/* Control Buttons */}
            <div className="flex gap-3">
                <button
                    onClick={onTogglePlay}
                    disabled={disabled}
                    className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 disabled:from-gray-700 disabled:to-gray-700 text-white font-semibold py-4 px-6 rounded-xl transition-smooth glow disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isPlaying ? (
                        <>
                            <Pause size={20} />
                            <span>Pause</span>
                        </>
                    ) : (
                        <>
                            <Play size={20} />
                            <span>Play</span>
                        </>
                    )}
                </button>

                <button
                    onClick={onReset}
                    disabled={disabled}
                    className="flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 text-white font-semibold py-4 px-6 rounded-xl transition-smooth disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <RotateCcw size={20} />
                </button>
            </div>
        </div>
    );
}
