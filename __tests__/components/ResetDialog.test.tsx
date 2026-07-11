import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ResetDialog from '@/components/reset-dialog';

describe('ResetDialog', () => {
  it('renders the trigger button', () => {
    render(
      <ResetDialog
        onConfirm={jest.fn()}
        trigger={<button>Reset</button>}
      />,
    );
    expect(screen.getByText('Reset')).toBeInTheDocument();
  });

  it('shows dialog content when trigger is clicked', () => {
    render(
      <ResetDialog
        onConfirm={jest.fn()}
        trigger={<button>Reset</button>}
      />,
    );
    fireEvent.click(screen.getByText('Reset'));
    expect(screen.getByText('Confirm Reset')).toBeInTheDocument();
    expect(
      screen.getByText('Are you sure you want to reset everything?'),
    ).toBeInTheDocument();
  });

  it('shows Cancel and the Reset action button in dialog', () => {
    render(
      <ResetDialog
        onConfirm={jest.fn()}
        trigger={<button>Reset</button>}
      />,
    );
    fireEvent.click(screen.getByText('Reset'));
    // In the alert dialog, "Reset" appears as both the trigger AND the action button
    // Use getAllByText and check the second one is the action
    expect(screen.getAllByText('Reset').length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('calls onConfirm when the dialog Reset action is clicked', () => {
    const onConfirm = jest.fn();
    render(
      <ResetDialog
        onConfirm={onConfirm}
        trigger={<button>Reset</button>}
      />,
    );
    fireEvent.click(screen.getByText('Reset'));
    // Click the Reset action button (there are 2: trigger + action)
    const resetButtons = screen.getAllByText('Reset');
    fireEvent.click(resetButtons[1]); // Click the second one (action button)
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('does not call onConfirm when Cancel is clicked', () => {
    const onConfirm = jest.fn();
    render(
      <ResetDialog
        onConfirm={onConfirm}
        trigger={<button>Reset</button>}
      />,
    );
    fireEvent.click(screen.getByText('Reset'));
    fireEvent.click(screen.getByText('Cancel'));
    expect(onConfirm).not.toHaveBeenCalled();
  });
});
