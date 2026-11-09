import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import ApplicationSettingsModal from './ApplicationSettingsModal';

describe('ApplicationSettingsModal', () => {
  test('applies independent fetching', () => {
    const onApply = jest.fn();
    render(
      <ApplicationSettingsModal
        visible
        syncMode
        onApply={onApply}
        onClose={() => {}}
      />
    );

    fireEvent.click(screen.getByLabelText(/Independent/));
    fireEvent.click(screen.getByText('Apply'));

    expect(onApply).toHaveBeenCalledWith({ syncMode: false });
  });
});
