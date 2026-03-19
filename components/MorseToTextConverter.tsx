'use client';

import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AudioInputModeToggle, AudioInputMode } from './conversion-mode-toggle';
import { Volume2, Mic, MicOff } from 'lucide-react';

interface MorseToTextConverterProps {
  audioInputMode: AudioInputMode;
  setAudioInputMode: (mode: AudioInputMode) => void;
  isListening: boolean;
  morseInput: string;
  setMorseInput: (morse: string) => void;
  decodedText: string;
  audioDevices: MediaDeviceInfo[];
  selectedDeviceId: string;
  setSelectedDeviceId: (id: string) => void;
  startAudioRecognition: () => Promise<void>;
  stopAudioRecognition: () => void;
  enumerateAudioDevices: () => Promise<void>;
  isTestingMic: boolean;
  startTestMicrophone: () => Promise<void>;
  stopTestMicrophone: () => void;
  audioLevel: number;
  testMicError: string | null;
}

export default function MorseToTextConverter({
  audioInputMode,
  setAudioInputMode,
  isListening,
  morseInput,
  setMorseInput,
  decodedText,
  audioDevices,
  selectedDeviceId,
  setSelectedDeviceId,
  startAudioRecognition,
  stopAudioRecognition,
  enumerateAudioDevices,
  isTestingMic,
  startTestMicrophone,
  stopTestMicrophone,
  audioLevel,
  testMicError,
}: MorseToTextConverterProps) {
  return (
    <>
      {/* Audio Input Mode Toggle */}
      <div className='animate-fade-in-up stagger-1'>
        <Card className='overflow-hidden'>
          <CardHeader className='pb-4'>
            <div className='flex items-center gap-2'>
              <Mic className='h-4 w-4 text-primary' />
              <span className='text-sm font-medium'>Audio Input</span>
            </div>
          </CardHeader>
          <CardContent className='space-y-4'>
            <AudioInputModeToggle
              audioInputMode={audioInputMode}
              setAudioInputMode={setAudioInputMode}
              isListening={isListening}
            />

            {/* Microphone Input Section */}
            {audioInputMode === 'microphone' && (
              <div className='flex flex-col items-center gap-4 py-4'>
                {/* Device Selection */}
                <div className='w-full max-w-xs'>
                  <label className='text-sm font-medium mb-2 block'>
                    Select Microphone
                  </label>
                  <select
                    value={selectedDeviceId}
                    onChange={e => setSelectedDeviceId(e.target.value)}
                    onClick={() => {
                      if (audioDevices.length === 0) {
                        enumerateAudioDevices();
                      }
                    }}
                    className='w-full rounded-md border border-input bg-background px-3 py-2 text-sm'
                    disabled={isListening}
                  >
                    {audioDevices.length === 0 ? (
                      <option value=''>Click to load devices...</option>
                    ) : (
                      audioDevices.map(device => (
                        <option key={device.deviceId} value={device.deviceId}>
                          {device.label ||
                            `Microphone ${device.deviceId.slice(0, 8)}`}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <Button
                  onClick={
                    isListening ? stopAudioRecognition : startAudioRecognition
                  }
                  size='lg'
                  className={`gap-2 ${
                    isListening
                      ? 'bg-destructive hover:bg-destructive/90 animate-pulse-glow'
                      : ''
                  }`}
                  disabled={!selectedDeviceId && audioDevices.length > 0}
                >
                  {isListening ? (
                    <>
                      <MicOff className='h-4 w-4' />
                      Stop Listening
                    </>
                  ) : (
                    <>
                      <Mic className='h-4 w-4' />
                      Start Listening
                    </>
                  )}
                </Button>
                <p className='text-xs text-muted-foreground text-center'>
                  {isListening
                    ? 'Listening for Morse code... Speak or play Morse audio'
                    : 'Select a microphone and click start to begin'}
                </p>

                {/* Test Microphone Section */}
                <div className='flex flex-col items-center gap-4 py-4 border-t mt-4'>
                  <Button
                    onClick={
                      isTestingMic ? stopTestMicrophone : startTestMicrophone
                    }
                    variant={isTestingMic ? 'secondary' : 'outline'}
                    size='lg'
                    className='gap-2'
                    disabled={!selectedDeviceId && audioDevices.length > 0}
                  >
                    {isTestingMic ? (
                      <>
                        <MicOff className='h-4 w-4' />
                        Stop Test
                      </>
                    ) : (
                      <>
                        <Volume2 className='h-4 w-4' />
                        Test Microphone
                      </>
                    )}
                  </Button>

                  {/* Audio Level Visualization */}
                  {isTestingMic && (
                    <div className='w-full max-w-xs space-y-2'>
                      <div className='flex items-center justify-between text-xs text-muted-foreground'>
                        <span>Volume Level</span>
                        <span
                          className={`font-medium ${
                            audioLevel > 10
                              ? 'text-green-500'
                              : 'text-yellow-500'
                          }`}
                        >
                          {audioLevel > 10
                            ? 'Microphone Active'
                            : 'No Input Detected'}
                        </span>
                      </div>
                      <div className='h-3 w-full overflow-hidden rounded-full bg-secondary'>
                        <div
                          className={`h-full transition-all duration-75 ${
                            audioLevel > 10 ? 'bg-green-500' : 'bg-yellow-500'
                          }`}
                          style={{ width: `${audioLevel}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Error Display */}
                  {testMicError && (
                    <div className='w-full max-w-xs rounded-md bg-destructive/10 p-3 text-sm text-destructive'>
                      {testMicError}
                    </div>
                  )}

                  <p className='text-xs text-muted-foreground text-center'>
                    {isTestingMic
                      ? 'Testing microphone... Make some noise to see the level'
                      : 'Test your microphone before starting recognition'}
                  </p>
                </div>
              </div>
            )}

            {/* File Input Section */}
            {audioInputMode === 'file' && (
              <div className='flex flex-col items-center gap-4 py-4'>
                <input
                  type='file'
                  accept='audio/*'
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = () => {
                        alert(
                          'Audio file loaded. For demo, please enter Morse code manually below.',
                        );
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className='hidden'
                  id='audio-file-input'
                />
                <Button
                  variant='outline'
                  onClick={() =>
                    document.getElementById('audio-file-input')?.click()
                  }
                  size='lg'
                  className='gap-2'
                >
                  <Volume2 className='h-4 w-4' />
                  Load Audio File
                </Button>
                <p className='text-xs text-muted-foreground text-center'>
                  Load an audio file containing Morse code
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Morse Input Section */}
      <div className='animate-fade-in-up stagger-2'>
        <Card className='overflow-hidden'>
          <CardHeader className='pb-4'>
            <div className='flex items-center gap-2'>
              <span className='text-primary'>· –</span>
              <span className='text-sm font-medium'>Morse Input</span>
            </div>
          </CardHeader>
          <CardContent className='space-y-4'>
            <textarea
              value={morseInput}
              onChange={e => setMorseInput(e.target.value)}
              placeholder='Enter Morse code here (e.g., ... --- ... for SOS)'
              className='min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'
            />
            <p className='text-xs text-muted-foreground'>
              Use dots (.) and dashes (-) separated by spaces. Use / for word
              gaps.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Decoded Text Output */}
      <div className='animate-fade-in-up stagger-3'>
        <Card className='overflow-hidden'>
          <CardHeader className='pb-4'>
            <div className='flex items-center gap-2'>
              <Volume2 className='h-4 w-4 text-primary' />
              <span className='text-sm font-medium'>Decoded Text</span>
            </div>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm'>
              {decodedText || (
                <span className='text-muted-foreground'>
                  Decoded text will appear here...
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
