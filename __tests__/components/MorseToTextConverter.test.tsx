import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import MorseToTextConverter from '@/components/MorseToTextConverter';
import { AudioInputMode } from '@/components/conversion-mode-toggle';

// Type for partial props
type PartialProps = Partial<{
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
}>;

const defaultProps = {
  audioInputMode: 'microphone' as AudioInputMode,
  setAudioInputMode: jest.fn(),
  isListening: false,
  morseInput: '',
  setMorseInput: jest.fn(),
  decodedText: '',
  audioDevices: [],
  selectedDeviceId: '',
  setSelectedDeviceId: jest.fn(),
  startAudioRecognition: jest.fn().mockResolvedValue(undefined),
  stopAudioRecognition: jest.fn(),
  enumerateAudioDevices: jest.fn().mockResolvedValue(undefined),
  isTestingMic: false,
  startTestMicrophone: jest.fn().mockResolvedValue(undefined),
  stopTestMicrophone: jest.fn(),
  audioLevel: 0,
  testMicError: null,
};

function renderComponent(props: PartialProps = {}) {
  const mergedProps = { ...defaultProps, ...props };
  return render(<MorseToTextConverter {...mergedProps} />);
}

describe('MorseToTextConverter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Default rendering', () => {
    it('renders the Audio Input card', () => {
      renderComponent();
      expect(screen.getByText('Audio Input')).toBeInTheDocument();
    });

    it('renders the Morse Input card', () => {
      renderComponent();
      expect(screen.getByText('Morse Input')).toBeInTheDocument();
    });

    it('renders the Decoded Text card', () => {
      renderComponent();
      expect(screen.getByText('Decoded Text')).toBeInTheDocument();
    });

    it('shows microphone and file mode toggles', () => {
      renderComponent();
      expect(screen.getByText('Microphone')).toBeInTheDocument();
      expect(screen.getByText('Audio File')).toBeInTheDocument();
    });
  });

  describe('Microphone mode', () => {
    it('shows Start Listening button when not listening', () => {
      renderComponent({ isListening: false });
      expect(screen.getByText('Start Listening')).toBeInTheDocument();
    });

    it('shows Stop Listening button when listening', () => {
      renderComponent({ isListening: true });
      expect(screen.getByText('Stop Listening')).toBeInTheDocument();
    });

    it('shows device selection dropdown', () => {
      renderComponent();
      expect(screen.getByText('Select Microphone')).toBeInTheDocument();
    });

    it('shows loading message when no devices', () => {
      renderComponent({ audioDevices: [] });
      expect(screen.getByText('Loading devices...')).toBeInTheDocument();
    });

    it('renders device options when devices available', () => {
      const mockDevices = [
        { deviceId: 'device-1', label: 'Built-in Microphone', kind: 'audioinput', groupId: 'group-1' } as MediaDeviceInfo,
        { deviceId: 'device-2', label: 'External Mic', kind: 'audioinput', groupId: 'group-2' } as MediaDeviceInfo,
      ];
      renderComponent({ audioDevices: mockDevices });
      expect(screen.getByText('Built-in Microphone')).toBeInTheDocument();
      expect(screen.getByText('External Mic')).toBeInTheDocument();
    });

    it('calls startAudioRecognition when Start Listening is clicked', () => {
      const startAudioRecognition = jest.fn().mockResolvedValue(undefined);
      renderComponent({
        startAudioRecognition,
        audioDevices: [{ deviceId: 'mic-1', label: 'Mic', kind: 'audioinput', groupId: 'g1' }] as MediaDeviceInfo[],
        selectedDeviceId: 'mic-1',
        isListening: false,
      });
      fireEvent.click(screen.getByText('Start Listening'));
      expect(startAudioRecognition).toHaveBeenCalledTimes(1);
    });

    it('calls stopAudioRecognition when Stop Listening is clicked', () => {
      const stopAudioRecognition = jest.fn();
      renderComponent({ stopAudioRecognition, isListening: true });
      fireEvent.click(screen.getByText('Stop Listening'));
      expect(stopAudioRecognition).toHaveBeenCalledTimes(1);
    });

    it('disables Start/Stop button when no device selected and devices exist', () => {
      renderComponent({
        selectedDeviceId: '',
        audioDevices: [{ deviceId: 'mic-1', label: 'Mic', kind: 'audioinput', groupId: 'g1' }] as MediaDeviceInfo[],
      });
      expect(screen.getByRole('button', { name: /Start Listening/i })).toBeDisabled();
    });

    it('shows listening status text when listening', () => {
      renderComponent({ isListening: true });
      expect(
        screen.getByText('Listening for Morse code... Speak or play Morse audio'),
      ).toBeInTheDocument();
    });

    it('shows instruction text when not listening', () => {
      renderComponent({ isListening: false });
      expect(
        screen.getByText('Select a microphone and click start to begin'),
      ).toBeInTheDocument();
    });
  });

  describe('Microphone selection', () => {
    it('calls setSelectedDeviceId on device change', () => {
      const setSelectedDeviceId = jest.fn();
      const mockDevices = [
        { deviceId: 'mic-1', label: 'Mic 1', kind: 'audioinput', groupId: 'g1' } as MediaDeviceInfo,
        { deviceId: 'mic-2', label: 'Mic 2', kind: 'audioinput', groupId: 'g2' } as MediaDeviceInfo,
      ];
      renderComponent({
        audioDevices: mockDevices,
        selectedDeviceId: 'mic-1',
        setSelectedDeviceId,
      });
      
      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: 'mic-2' } });
      expect(setSelectedDeviceId).toHaveBeenCalledWith('mic-2');
    });

    it('shows device placeholder label when device has no label', () => {
      const mockDevices = [
        { deviceId: 'abc12345', label: '', kind: 'audioinput', groupId: 'g1' } as MediaDeviceInfo,
      ];
      renderComponent({ audioDevices: mockDevices });
      expect(screen.getByText(/Microphone abc12345/)).toBeInTheDocument();
    });

    it('calls enumerateAudioDevices on Refresh click', () => {
      const enumerateAudioDevices = jest.fn().mockResolvedValue(undefined);
      renderComponent({
        enumerateAudioDevices,
        audioDevices: [{ deviceId: 'mic-1', label: 'Mic', kind: 'audioinput', groupId: 'g1' }] as MediaDeviceInfo[],
      });
      fireEvent.click(screen.getByTitle('Refresh microphone list'));
      expect(enumerateAudioDevices).toHaveBeenCalledTimes(1);
    });
  });

  describe('Test Microphone section', () => {
    it('shows Test Microphone button', () => {
      renderComponent();
      expect(screen.getByText('Test Microphone')).toBeInTheDocument();
    });

    it('shows Stop Test button when testing mic', () => {
      renderComponent({ isTestingMic: true });
      expect(screen.getByText('Stop Test')).toBeInTheDocument();
    });

    it('calls startTestMicrophone when Test Microphone clicked', () => {
      const startTestMicrophone = jest.fn().mockResolvedValue(undefined);
      renderComponent({
        startTestMicrophone,
        audioDevices: [{ deviceId: 'mic-1', label: 'Mic', kind: 'audioinput', groupId: 'g1' }] as MediaDeviceInfo[],
        selectedDeviceId: 'mic-1',
      });
      fireEvent.click(screen.getByText('Test Microphone'));
      expect(startTestMicrophone).toHaveBeenCalledTimes(1);
    });

    it('calls stopTestMicrophone when Stop Test clicked', () => {
      const stopTestMicrophone = jest.fn();
      renderComponent({ stopTestMicrophone, isTestingMic: true });
      fireEvent.click(screen.getByText('Stop Test'));
      expect(stopTestMicrophone).toHaveBeenCalledTimes(1);
    });

    it('shows audio level bar when testing mic', () => {
      renderComponent({ isTestingMic: true, audioLevel: 50 });
      expect(screen.getByText('Volume Level')).toBeInTheDocument();
      expect(screen.getByText('Microphone Active')).toBeInTheDocument();
    });

    it('shows No Input Detected when audio level is low', () => {
      renderComponent({ isTestingMic: true, audioLevel: 0 });
      expect(screen.getByText('No Input Detected')).toBeInTheDocument();
    });

    it('shows test mic error when provided', () => {
      renderComponent({ testMicError: 'Microphone access denied.' });
      expect(screen.getByText('Microphone access denied.')).toBeInTheDocument();
    });
  });

  describe('File input mode', () => {
    it('shows Load Audio File button when in file mode', () => {
      renderComponent({ audioInputMode: 'file' });
      expect(screen.getByText('Load Audio File')).toBeInTheDocument();
    });

    it('does not show microphone controls in file mode', () => {
      renderComponent({ audioInputMode: 'file' });
      expect(screen.queryByText('Start Listening')).not.toBeInTheDocument();
      expect(screen.queryByText('Select Microphone')).not.toBeInTheDocument();
    });

    it('does not show file controls in microphone mode', () => {
      renderComponent({ audioInputMode: 'microphone' });
      expect(screen.queryByText('Load Audio File')).not.toBeInTheDocument();
    });
  });

  describe('Morse Input section', () => {
    it('shows the morse input textarea', () => {
      renderComponent();
      const textarea = screen.getByPlaceholderText(
        'Enter Morse code here (e.g., ... --- ... for SOS)',
      );
      expect(textarea).toBeInTheDocument();
    });

    it('displays the morseInput value', () => {
      renderComponent({ morseInput: '... --- ...' });
      const textarea = screen.getByPlaceholderText(
        'Enter Morse code here (e.g., ... --- ... for SOS)',
      ) as HTMLTextAreaElement;
      expect(textarea.value).toBe('... --- ...');
    });

    it('calls setMorseInput on textarea change', () => {
      const setMorseInput = jest.fn();
      renderComponent({ setMorseInput });
      const textarea = screen.getByPlaceholderText(
        'Enter Morse code here (e.g., ... --- ... for SOS)',
      );
      fireEvent.change(textarea, { target: { value: '.-' } });
      expect(setMorseInput).toHaveBeenCalledWith('.-');
    });

    it('shows usage hint text', () => {
      renderComponent();
      expect(
        screen.getByText(
          'Use dots (.) and dashes (-) separated by spaces. Use / for word gaps.',
        ),
      ).toBeInTheDocument();
    });
  });

  describe('Decoded Text section', () => {
    it('shows decoded text when provided', () => {
      renderComponent({ decodedText: 'SOS' });
      expect(screen.getByText('SOS')).toBeInTheDocument();
    });

    it('shows placeholder when no decoded text', () => {
      renderComponent({ decodedText: '' });
      expect(
        screen.getByText('Decoded text will appear here...'),
      ).toBeInTheDocument();
    });
  });

  describe('Mode toggling', () => {
    it('calls setAudioInputMode when Microphone button clicked', () => {
      const setAudioInputMode = jest.fn();
      renderComponent({ setAudioInputMode, audioInputMode: 'file' });
      fireEvent.click(screen.getByText('Microphone'));
      expect(setAudioInputMode).toHaveBeenCalledWith('microphone');
    });

    it('calls setAudioInputMode when Audio File button clicked', () => {
      const setAudioInputMode = jest.fn();
      renderComponent({ setAudioInputMode, audioInputMode: 'microphone' });
      fireEvent.click(screen.getByText('Audio File'));
      expect(setAudioInputMode).toHaveBeenCalledWith('file');
    });
  });
});
