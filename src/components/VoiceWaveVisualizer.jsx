import React, { useRef, useEffect } from 'react';

export default function VoiceWaveVisualizer({ isListening = false }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let phase = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      
      const width = canvas.width;
      const height = canvas.height;
      const centerY = height / 2;
      
      // Select vibrant gradient colors based on active listen state
      const gradient = ctx.createLinearGradient(0, 0, width, 0);
      if (isListening) {
        gradient.addColorStop(0, '#0ea5e9'); // Cyan
        gradient.addColorStop(0.5, '#d946ef'); // Magenta
        gradient.addColorStop(1, '#10b981'); // Lime Green
      } else {
        gradient.addColorStop(0, 'rgba(14, 165, 233, 0.4)');
        gradient.addColorStop(1, 'rgba(217, 70, 239, 0.4)');
      }

      ctx.strokeStyle = gradient;
      ctx.lineCap = 'round';

      // Draw 3 layers of sine waves with different offsets and amplitudes
      const waveCount = 3;
      for (let w = 0; w < waveCount; w++) {
        ctx.beginPath();
        // Lower opacity for background wave layers
        ctx.lineWidth = w === 0 ? 3 : 1.5;
        ctx.strokeStyle = w === 0 ? gradient : `rgba(217, 70, 239, ${0.4 - w * 0.1})`;

        const amplitude = isListening 
          ? (w === 0 ? 35 : 20) + Math.random() * 8
          : (w === 0 ? 12 : 6);

        const frequency = isListening 
          ? 0.02 + w * 0.005 
          : 0.015 + w * 0.005;

        const speed = isListening ? 0.15 - w * 0.02 : 0.05 - w * 0.01;

        for (let x = 0; x < width; x++) {
          const y = centerY + Math.sin(x * frequency + phase + (w * Math.PI / 2)) * amplitude * Math.sin(x * Math.PI / width);
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      phase += isListening ? 0.2 : 0.04;
      ctx.restore();
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isListening]);

  return (
    <div className="w-full h-32 bg-slate-900/5 rounded-2xl border border-slate-100 flex items-center justify-center p-2 overflow-hidden shadow-inner">
      <canvas
        ref={canvasRef}
        width={600}
        height={120}
        className="w-full h-full block"
      />
    </div>
  );
}
