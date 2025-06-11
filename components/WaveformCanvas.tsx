import React, { useEffect, useRef, useCallback } from 'react';

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
  const animationIdRef = useRef<number | undefined>(undefined);
  const lastFrameTimeRef = useRef<number>(0);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);

  // Target 30 FPS instead of 60 for better performance
  const TARGET_FPS = 30;
  const FRAME_DURATION = 1000 / TARGET_FPS;

  // Initialize canvas context and data array once
  const initializeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const analyser = analyserRef.current;

    if (!canvas || !analyser) return false;

    if (!ctxRef.current) {
      const ctx = canvas.getContext('2d', {
        // Optimize canvas for better performance
        alpha: false,
        desynchronized: true,
        willReadFrequently: false,
      });
      if (!ctx) return false;
      ctxRef.current = ctx;
    }

    if (!dataArrayRef.current) {
      // Create Uint8Array with explicit ArrayBuffer for Web Audio API compatibility
      const bufferLength = analyser.frequencyBinCount;
      const buffer = new ArrayBuffer(bufferLength);
      dataArrayRef.current = new Uint8Array(buffer) as Uint8Array;
    }

    return true;
  }, [canvasRef, analyserRef]);

  // Optimized draw function with frame rate limiting
  const drawWaveform = useCallback(
    (currentTime: number) => {
      // Frame rate limiting
      if (currentTime - lastFrameTimeRef.current < FRAME_DURATION) {
        if (isPlaying) {
          animationIdRef.current = requestAnimationFrame(drawWaveform);
        }
        return;
      }
      lastFrameTimeRef.current = currentTime;

      const canvas = canvasRef.current;
      const analyser = analyserRef.current;
      const ctx = ctxRef.current;
      const dataArray = dataArrayRef.current;

      if (!canvas || !analyser || !ctx || !dataArray) return;

      // Get audio data - use type assertion to resolve TypeScript strict typing

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      analyser.getByteTimeDomainData(dataArray as any);

      // Clear canvas efficiently
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw waveform
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#00ff00';
      ctx.beginPath();

      // Optimize drawing by sampling fewer points for display
      const bufferLength = dataArray.length;
      const sampleRate = Math.max(1, Math.floor(bufferLength / canvas.width));
      const sliceWidth = canvas.width / (bufferLength / sampleRate);

      let x = 0;
      for (let i = 0; i < bufferLength; i += sampleRate) {
        // Average multiple samples for smoother display
        let sum = 0;
        const sampleEnd = Math.min(i + sampleRate, bufferLength);
        for (let j = i; j < sampleEnd; j++) {
          sum += dataArray[j];
        }
        const avg = sum / (sampleEnd - i);

        const v = avg / 128.0;
        const y = (v * canvas.height) / 2;

        if (x === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
        x += sliceWidth;
      }

      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();

      // Continue animation if still playing
      if (isPlaying) {
        animationIdRef.current = requestAnimationFrame(drawWaveform);
      }
    },
    [isPlaying, canvasRef, analyserRef, FRAME_DURATION],
  );

  // Enhanced cleanup function
  const stopAnimation = useCallback(() => {
    if (animationIdRef.current !== undefined) {
      cancelAnimationFrame(animationIdRef.current);
      animationIdRef.current = undefined;
    }

    // Clear canvas when stopped
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (canvas && ctx) {
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw center line when not playing
      ctx.strokeStyle = '#333333';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, canvas.height / 2);
      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();
    }
  }, [canvasRef]);

  // Main effect for managing animation
  useEffect(() => {
    if (isPlaying) {
      if (initializeCanvas()) {
        // Reset frame timing
        lastFrameTimeRef.current = 0;
        animationIdRef.current = requestAnimationFrame(drawWaveform);
      }
    } else {
      stopAnimation();
    }

    // Cleanup on unmount or when dependencies change
    return () => {
      stopAnimation();
    };
  }, [isPlaying, initializeCanvas, drawWaveform, stopAnimation]);

  // Handle canvas resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        // Update canvas resolution to match display size
        const dpr = window.devicePixelRatio || 1;
        canvas.width = width * dpr;
        canvas.height = height * dpr;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.scale(dpr, dpr);
          ctxRef.current = ctx;
        }
      }
    });

    resizeObserver.observe(canvas);

    return () => {
      resizeObserver.disconnect();
    };
  }, [canvasRef]);

  return (
    <div className='space-y-2'>
      <div className='text-sm text-muted-foreground'>Audio Waveform</div>
      <canvas
        ref={canvasRef}
        width={500}
        height={100}
        className='w-full h-24 bg-black rounded shadow-sm border'
        style={{
          // Optimize canvas rendering
          imageRendering: 'auto',
          willChange: isPlaying ? 'contents' : 'auto',
        }}
      />
    </div>
  );
}
