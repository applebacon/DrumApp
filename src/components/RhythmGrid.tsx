import { useEffect, useRef } from 'react';
import type { TimingEvent } from '../types';

interface RhythmGridProps {
    recentHits: TimingEvent[];
    bpm: number;
    isPlaying: boolean;
}

export default function RhythmGrid({ recentHits, bpm, isPlaying }: RhythmGridProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const scrollOffsetRef = useRef(0);
    const animationFrameRef = useRef<number | null>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const width = canvas.width;
        const height = canvas.height;
        const centerY = height / 2;
        const gridSpacing = 100; // pixels between beats

        const draw = () => {
            // Clear canvas
            ctx.fillStyle = 'rgba(10, 10, 15, 0.9)';
            ctx.fillRect(0, 0, width, height);

            // Auto-scroll when playing
            if (isPlaying) {
                const pixelsPerSecond = (bpm / 60) * gridSpacing;
                scrollOffsetRef.current += pixelsPerSecond / 60; // Assuming 60fps
            }

            // Draw grid lines (beats)
            ctx.strokeStyle = 'rgba(139, 92, 246, 0.3)';
            ctx.lineWidth = 2;

            for (let i = -2; i < width / gridSpacing + 2; i++) {
                const x = (i * gridSpacing - (scrollOffsetRef.current % gridSpacing)) % width;
                if (x < 0) continue;

                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, height);
                ctx.stroke();

                // Beat number
                ctx.fillStyle = 'rgba(139, 92, 246, 0.5)';
                ctx.font = '12px Inter';
                ctx.textAlign = 'center';
                const beatNumber = Math.floor((scrollOffsetRef.current + x) / gridSpacing) % 4 + 1;
                ctx.fillText(beatNumber.toString(), x, 20);
            }

            // Draw center line (perfect timing)
            ctx.strokeStyle = 'rgba(34, 197, 94, 0.5)';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.moveTo(0, centerY);
            ctx.lineTo(width, centerY);
            ctx.stroke();
            ctx.setLineDash([]);

            // Draw timing zones
            ctx.fillStyle = 'rgba(34, 197, 94, 0.1)';
            ctx.fillRect(0, centerY - 20, width, 40); // Perfect zone

            // Draw hit markers
            recentHits.slice(-20).forEach((hit, index) => {
                const age = recentHits.length - index;
                const opacity = Math.max(0.3, 1 - age / 20);

                // Position based on offset
                const y = centerY + hit.offset * 2; // Scale offset for visibility
                const x = width - (age * 30); // Recent hits on the right

                if (x < 0 || x > width) return;

                // Draw hit marker
                const isPerfect = Math.abs(hit.offset) < 10;
                ctx.fillStyle = isPerfect
                    ? `rgba(34, 197, 94, ${opacity})`
                    : hit.offset < 0
                        ? `rgba(239, 68, 68, ${opacity})`
                        : `rgba(59, 130, 246, ${opacity})`;

                ctx.beginPath();
                ctx.arc(x, y, 6, 0, Math.PI * 2);
                ctx.fill();

                // Draw line to center
                ctx.strokeStyle = ctx.fillStyle;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(x, centerY);
                ctx.stroke();
            });

            // Draw labels
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.font = '11px Inter';
            ctx.textAlign = 'left';
            ctx.fillText('Rushing', 10, 30);
            ctx.fillText('Perfect', 10, centerY - 5);
            ctx.fillText('Dragging', 10, height - 20);

            animationFrameRef.current = requestAnimationFrame(draw);
        };

        draw();

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [recentHits, bpm, isPlaying]);

    return (
        <div className="glass rounded-2xl p-6">
            <h2 className="text-xl font-bold mb-4 text-gray-300">Rhythm Grid</h2>
            <canvas
                ref={canvasRef}
                width={800}
                height={300}
                className="w-full rounded-lg border border-gray-700"
            />
            <div className="mt-3 text-xs text-gray-500 text-center">
                Hits are shown relative to the beat grid. Green zone = perfect timing.
            </div>
        </div>
    );
}
