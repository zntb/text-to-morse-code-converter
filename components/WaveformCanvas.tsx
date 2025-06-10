import React, { useEffect } from 'react';

interface WaveformCanvasProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  isPlaying: boolean;
  analyserRef: React.RefObject<AnalyserNode | null>;
}

export default function WaveformCanvas({
  canvasRef,
  isPlaying,
  analyserRef,
}: WaveformCanvasProps) {
  useEffect(() => {
    let animationId: number | undefined;
    const drawWaveform = () => {
      const canvas = canvasRef.current;
      const analyser = analyserRef.current;
      if (!canvas || !analyser) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const bufferLength = analyser.fftSize;
      const dataArray = new Uint8Array(bufferLength);
      const draw = () => {
        animationId = requestAnimationFrame(draw);
        analyser.getByteTimeDomainData(dataArray);
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'lime';
        ctx.beginPath();
        const sliceWidth = canvas.width / bufferLength;
        let x = 0;
        for (let i = 0; i < bufferLength; i++) {
          const v = dataArray[i] / 128.0;
          const y = (v * canvas.height) / 2;
          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
          x += sliceWidth;
        }
        ctx.lineTo(canvas.width, canvas.height / 2);
        ctx.stroke();
      };
      draw();
    };
    if (isPlaying) drawWaveform();
    else if (animationId !== undefined) cancelAnimationFrame(animationId);
    return () => {
      if (animationId !== undefined) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [isPlaying, canvasRef, analyserRef]);

  return (
    <div>
      <canvas
        ref={canvasRef}
        width={500}
        height={100}
        className='w-full h-24 bg-black rounded shadow'
      />
    </div>
  );
}
