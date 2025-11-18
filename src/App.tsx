import { useState } from 'react';
import { useAudioEngine } from './hooks/useAudioEngine';
import MetronomeControls from './components/MetronomeControls';
import AccuracyMeter from './components/AccuracyMeter';
import TimingDisplay from './components/TimingDisplay';
import RhythmGrid from './components/RhythmGrid';
import CalibrationModal from './components/CalibrationModal';

function App() {
  const {
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
  } = useAudioEngine();

  const [showCalibration, setShowCalibration] = useState(false);

  const handleCalibrate = () => {
    setShowCalibration(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-8">
          <div className="text-center">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent mb-2">
              DrumSync
            </h1>
            <p className="text-gray-400">
              Perfect your timing with real-time feedback
            </p>
          </div>
        </header>

        {/* Initialization Message */}
        {!isInitialized && (
          <div className="glass rounded-2xl p-8 text-center">
            <div className="text-xl text-gray-300 mb-4">
              Initializing audio engine...
            </div>
            <div className="text-sm text-gray-500">
              Please grant microphone access when prompted
            </div>
          </div>
        )}

        {/* Main Content */}
        {isInitialized && (
          <div className="space-y-6">
            {/* Top Row: Controls and Accuracy Meter */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <MetronomeControls
                isPlaying={isPlaying}
                bpm={bpm}
                onTogglePlay={togglePlay}
                onBpmChange={updateBpm}
                onReset={resetMetrics}
                disabled={isCalibrating}
              />

              <AccuracyMeter averageOffset={accuracyMetrics.averageOffset} />
            </div>

            {/* Middle Row: Statistics */}
            <TimingDisplay
              metrics={accuracyMetrics}
              systemLatency={systemLatency}
              isCalibrating={isCalibrating}
              onCalibrate={handleCalibrate}
              disabled={isPlaying}
            />

            {/* Bottom Row: Rhythm Grid */}
            <RhythmGrid
              recentHits={accuracyMetrics.recentHits}
              bpm={bpm}
              isPlaying={isPlaying}
            />

            {/* Beat Indicator */}
            {isPlaying && (
              <div className="fixed bottom-8 right-8 glass rounded-full w-20 h-20 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-400">
                    {currentBeat + 1}
                  </div>
                  <div className="text-xs text-gray-400">Beat</div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Calibration Modal */}
        <CalibrationModal
          isOpen={showCalibration}
          onClose={() => setShowCalibration(false)}
          onCalibrate={calibrateLatency}
        />
      </div>
    </div>
  );
}

export default App;
