import { useEffect, useRef } from 'react';

interface AccuracyMeterProps {
    averageOffset: number; // ms, negative = rushing, positive = dragging
    maxOffset?: number;
}

export default function AccuracyMeter({ averageOffset, maxOffset = 50 }: AccuracyMeterProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const width = canvas.width;
        const height = canvas.height;
        const centerX = width / 2;
        const centerY = height / 2;

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        // Draw background arc
        ctx.beginPath();
        ctx.arc(centerX, centerY, 80, Math.PI, 0, false);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 20;
        ctx.stroke();

        // Draw colored segments
        const segments = [
            { start: Math.PI, end: Math.PI * 0.75, color: 'rgb(239, 68, 68)' }, // Rushing (left)
            { start: Math.PI * 0.75, end: Math.PI * 0.6, color: 'rgba(239, 68, 68, 0.5)' },
            { start: Math.PI * 0.6, end: Math.PI * 0.4, color: 'rgb(34, 197, 94)' }, // Perfect (center)
            { start: Math.PI * 0.4, end: Math.PI * 0.25, color: 'rgba(59, 130, 246, 0.5)' },
            { start: Math.PI * 0.25, end: 0, color: 'rgb(59, 130, 246)' } // Dragging (right)
        ];

        segments.forEach(segment => {
            ctx.beginPath();
            ctx.arc(centerX, centerY, 80, segment.start, segment.end, false);
            ctx.strokeStyle = segment.color;
            ctx.lineWidth = 20;
            ctx.stroke();
        });

        // Calculate needle angle based on offset
        const normalizedOffset = Math.max(-maxOffset, Math.min(maxOffset, averageOffset));
        const angle = Math.PI - (normalizedOffset / maxOffset) * (Math.PI / 2) - Math.PI / 2;

        // Draw needle
        const needleLength = 70;
        const needleX = centerX + Math.cos(angle) * needleLength;
        const needleY = centerY + Math.sin(angle) * needleLength;

        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(needleX, needleY);
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Draw center circle
        ctx.beginPath();
        ctx.arc(centerX, centerY, 8, 0, Math.PI * 2);
        ctx.fillStyle = 'white';
        ctx.fill();

    }, [averageOffset, maxOffset]);

    const getStatusText = () => {
        if (Math.abs(averageOffset) < 5) return 'Perfect!';
        if (averageOffset < 0) return 'Rushing';
        return 'Dragging';
    };

    const getStatusColor = () => {
        if (Math.abs(averageOffset) < 5) return 'text-green-400';
        if (averageOffset < 0) return 'text-red-400';
        return 'text-blue-400';
    };

    return (
        <div className="glass rounded-2xl p-6 flex flex-col items-center">
            <h2 className="text-xl font-bold mb-4 text-gray-300">Timing</h2>

            <canvas
                ref={canvasRef}
                width={300}
                height={150}
                className="mb-4"
            />

            <div className="text-center">
                <div className={`text-2xl font-bold ${getStatusColor()}`}>
                    {getStatusText()}
                </div>
                <div className="text-sm text-gray-400 mt-1">
                    {averageOffset.toFixed(1)}ms
                </div>
            </div>

            <div className="flex gap-8 mt-6 text-xs text-gray-500">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <span>Rushing</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span>Perfect</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span>Dragging</span>
                </div>
            </div>
        </div>
    );
}
