import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import PresetButtons from '@/components/PresetButtons';

describe('PresetButtons', () => {
  const defaultProps = {
    customPresets: [],
    showPresetInput: false,
    newPresetName: '',
    newPresetText: '',
    onApplyPreset: jest.fn(),
    onDeletePreset: jest.fn(),
    onShowPresetInput: jest.fn(),
    onNewPresetNameChange: jest.fn(),
    onNewPresetTextChange: jest.fn(),
    onSavePreset: jest.fn(),
  };

  it('renders Quick Presets label', () => {
    render(<PresetButtons {...defaultProps} />);
    expect(screen.getByText('Quick Presets:')).toBeInTheDocument();
  });

  it('renders built-in preset buttons (SOS, MAYDAY, CQ, 73)', () => {
    render(<PresetButtons {...defaultProps} />);
    expect(screen.getByText('SOS')).toBeInTheDocument();
    expect(screen.getByText('MAYDAY')).toBeInTheDocument();
    expect(screen.getByText('CQ')).toBeInTheDocument();
    expect(screen.getByText('73')).toBeInTheDocument();
  });

  it('calls onApplyPreset when a built-in preset is clicked', () => {
    const onApplyPreset = jest.fn();
    render(
      <PresetButtons {...defaultProps} onApplyPreset={onApplyPreset} />,
    );
    fireEvent.click(screen.getByText('SOS'));
    expect(onApplyPreset).toHaveBeenCalledWith('SOS');
  });

  it('renders Add Custom button', () => {
    render(<PresetButtons {...defaultProps} />);
    expect(screen.getByText('Add Custom')).toBeInTheDocument();
  });

  it('shows preset input fields when showPresetInput is true', () => {
    render(
      <PresetButtons {...defaultProps} showPresetInput={true} />,
    );
    expect(screen.getByPlaceholderText('Name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Message')).toBeInTheDocument();
    expect(screen.getByText('Save')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('calls onShowPresetInput when Add Custom is clicked', () => {
    const onShowPresetInput = jest.fn();
    render(
      <PresetButtons
        {...defaultProps}
        onShowPresetInput={onShowPresetInput}
      />,
    );
    fireEvent.click(screen.getByText('Add Custom'));
    expect(onShowPresetInput).toHaveBeenCalledWith(true);
  });

  it('calls onSavePreset with name and text when Save is clicked', () => {
    const onSavePreset = jest.fn();
    render(
      <PresetButtons
        {...defaultProps}
        showPresetInput={true}
        newPresetName="Test"
        newPresetText="HELLO"
        onSavePreset={onSavePreset}
      />,
    );
    fireEvent.click(screen.getByText('Save'));
    expect(onSavePreset).toHaveBeenCalledWith('Test', 'HELLO');
  });

  it('disables Save button when name or text is empty', () => {
    render(
      <PresetButtons
        {...defaultProps}
        showPresetInput={true}
        newPresetName=""
        newPresetText=""
      />,
    );
    expect(screen.getByText('Save')).toBeDisabled();
  });

  it('renders custom presets when provided', () => {
    const customPresets = [
      { id: 'custom-1', name: 'Custom1', text: 'CUSTOM TEXT' },
    ];
    render(
      <PresetButtons
        {...defaultProps}
        customPresets={customPresets}
      />,
    );
    expect(screen.getByText('Custom1')).toBeInTheDocument();
  });

  it('calls onDeletePreset when custom preset delete is clicked', () => {
    const onDeletePreset = jest.fn();
    const customPresets = [
      { id: 'custom-1', name: 'Custom1', text: 'CUSTOM TEXT' },
    ];
    render(
      <PresetButtons
        {...defaultProps}
        customPresets={customPresets}
        onDeletePreset={onDeletePreset}
      />,
    );
    const deleteButtons = screen.getAllByRole('button');
    const deleteBtn = deleteButtons.find(b => b.querySelector('svg'));
    if (deleteBtn) fireEvent.click(deleteBtn);
    expect(onDeletePreset).toHaveBeenCalledWith('custom-1');
  });

  it('calls onApplyPreset when custom preset is clicked', () => {
    const onApplyPreset = jest.fn();
    const customPresets = [
      { id: 'custom-1', name: 'Custom1', text: 'CUSTOM TEXT' },
    ];
    render(
      <PresetButtons
        {...defaultProps}
        customPresets={customPresets}
        onApplyPreset={onApplyPreset}
      />,
    );
    fireEvent.click(screen.getByText('Custom1'));
    expect(onApplyPreset).toHaveBeenCalledWith('CUSTOM TEXT');
  });

  it('calls onCancel when Cancel is clicked', () => {
    const onShowPresetInput = jest.fn();
    const onNewPresetNameChange = jest.fn();
    const onNewPresetTextChange = jest.fn();
    render(
      <PresetButtons
        {...defaultProps}
        showPresetInput={true}
        onShowPresetInput={onShowPresetInput}
        onNewPresetNameChange={onNewPresetNameChange}
        onNewPresetTextChange={onNewPresetTextChange}
      />,
    );
    fireEvent.click(screen.getByText('Cancel'));
    expect(onShowPresetInput).toHaveBeenCalledWith(false);
    expect(onNewPresetNameChange).toHaveBeenCalledWith('');
    expect(onNewPresetTextChange).toHaveBeenCalledWith('');
  });
});
