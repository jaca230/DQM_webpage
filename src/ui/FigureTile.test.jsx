import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import FigureTile from './FigureTile';

describe('FigureTile', () => {
  const figureType = { id: 'Wfd5WaveformPlot', label: 'WFD5 Waveform' };

  const renderTile = () => render(
    <FigureTile
      title="Selected trace"
      figureType={figureType}
      settings={{}}
      schema={{}}
      onDelete={() => {}}
      onTitleChange={() => {}}
      onSettingsChange={() => {}}
    >
      <div>figure content</div>
    </FigureTile>
  );

  test('does not add the figure type to the tile header', () => {
    renderTile();

    expect(screen.queryByText('WFD5 Waveform')).toBeNull();
  });

  test('shows the display name and stable identifier in settings', () => {
    renderTile();
    fireEvent.click(screen.getByLabelText('Toggle settings menu'));

    expect(screen.getByText('Figure type')).not.toBeNull();
    expect(screen.getByText('Wfd5WaveformPlot')).not.toBeNull();
    expect(screen.getByText('WFD5 Waveform')).not.toBeNull();
  });

  test('uses one directly resizable settings panel without an expand button', () => {
    renderTile();
    fireEvent.click(screen.getByLabelText('Toggle settings menu'));

    expect(document.querySelectorAll('aside.figure-settings')).toHaveLength(1);
    expect(screen.queryByLabelText('Expand figure settings')).toBeNull();
  });
});
