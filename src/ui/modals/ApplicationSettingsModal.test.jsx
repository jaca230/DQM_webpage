import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import ApplicationSettingsModal from './ApplicationSettingsModal';

describe('ApplicationSettingsModal', () => {
  test('applies independent fetching and normalized zoom', () => {
    const onApply = jest.fn();
    render(
      <ApplicationSettingsModal
        visible
        syncMode
        zoom={1}
        defaultZoom={1}
        onApply={onApply}
        onClose={() => {}}
      />
    );

    fireEvent.click(screen.getByLabelText(/Independent/));
    fireEvent.change(screen.getByLabelText('Canvas zoom percent'), { target: { value: '175' } });
    fireEvent.click(screen.getByText('Apply'));

    expect(onApply).toHaveBeenCalledWith({ syncMode: false, zoom: 1.75 });
  });
});
