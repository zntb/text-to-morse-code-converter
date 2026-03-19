'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

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

  // Store drawWaveform in a ref to avoid circular reference
  const drawWaveformRef = useRef<(currentTime: number) => void>(() => {});

  // Optimized draw function with frame rate limiting
  const drawWaveform = useCallback(
    (currentTime: number) => {
      // Frame rate limiting
      if (currentTime - lastFrameTimeRef.current < FRAME_DURATION) {
        if (isPlaying) {
          animationIdRef.current = requestAnimationFrame(
            drawWaveformRef.current,
          );
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

      // Clear canvas efficiently with gradient background
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, '#0a0a0a');
      gradient.addColorStop(1, '#1a1a1a');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw glow effect
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#22c55e';

      // Draw waveform with enhanced styling
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = '#22c55e';
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

      // Reset shadow for next frame
      ctx.shadowBlur = 0;

      // Continue animation if still playing
      if (isPlaying) {
        animationIdRef.current = requestAnimationFrame(drawWaveformRef.current);
      }
    },
    [isPlaying, canvasRef, analyserRef, FRAME_DURATION, drawWaveformRef],
  );

  // Update the ref with the latest drawWaveform function
  useEffect(() => {
    drawWaveformRef.current = drawWaveform;
  }, [drawWaveform]);

  // Enhanced cleanup function
  const stopAnimation = useCallback(() => {
    if (animationIdRef.current !== undefined) {
      cancelAnimationFrame(animationIdRef.current);
      animationIdRef.current = undefined;
    }

    // Clear canvas when stopped with styled background
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (canvas && ctx) {
      // Draw background gradient
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, '#0a0a0a');
      gradient.addColorStop(1, '#1a1a1a');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw grid lines
      ctx.strokeStyle = 'rgba(34, 197, 94, 0.1)';
      ctx.lineWidth = 1;

      // Horizontal center line
      ctx.beginPath();
      ctx.moveTo(0, canvas.height / 2);
      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();

      // Quarter lines
      ctx.beginPath();
      ctx.moveTo(0, canvas.height / 4);
      ctx.lineTo(canvas.width, canvas.height / 4);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, (canvas.height * 3) / 4);
      ctx.lineTo(canvas.width, (canvas.height * 3) / 4);
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

        // Redraw static state if not playing
        if (!isPlaying) {
          stopAnimation();
        }
      }
    });

    resizeObserver.observe(canvas);

    return () => {
      resizeObserver.disconnect();
    };
  }, [canvasRef, isPlaying, stopAnimation]);

  return (
    <Card className='overflow-hidden'>
      <CardHeader className='pb-2'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <ActivityIcon
              className={`h-4 w-4 ${
                isPlaying
                  ? 'text-primary animate-pulse'
                  : 'text-muted-foreground'
              }`}
            />
            <span className='text-sm font-medium'>Audio Waveform</span>
          </div>
          <div className='flex items-center gap-2'>
            <span
              className={`h-2 w-2 rounded-full ${
                isPlaying ? 'bg-primary animate-pulse' : 'bg-muted'
              }`}
            />
            <span className='text-xs text-muted-foreground'>
              {isPlaying ? 'Playing' : 'Idle'}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <canvas
          ref={canvasRef}
          width={500}
          height={100}
          className='w-full h-24 rounded-lg'
          style={{
            imageRendering: 'auto',
            willChange: isPlaying ? 'contents' : 'auto',
          }}
        />
      </CardContent>
    </Card>
  );
}

// Simple Activity icon component
function ActivityIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width='24'
      height='24'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
      className={className}
    >
      <path d='M22 12h-4l-3 9L9 3l-3 9H2' />
    </svg>
  );
}
