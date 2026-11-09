import React from 'react';
import { act, render, screen } from '@testing-library/react';
import FigureErrorBoundary from './FigureErrorBoundary';

describe('FigureErrorBoundary', () => {
  let consoleError;

  beforeEach(() => {
    jest.useFakeTimers();
    consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleError.mockRestore();
    jest.useRealTimers();
  });

  test('automatically remounts a figure after transient startup failures', () => {
    let failuresRemaining = 4;
    class TransientFigure extends React.Component {
      componentDidMount() {
        if (failuresRemaining > 0) {
          failuresRemaining -= 1;
          throw new Error('transient Plotly startup failure');
        }
      }

      render() {
        return <div>Recovered plot</div>;
      }
    }

    render(
      <FigureErrorBoundary figureId="transient">
        <TransientFigure />
      </FigureErrorBoundary>
    );

    expect(screen.getByRole('status').textContent).toContain('Recovering figure');
    act(() => jest.advanceTimersByTime(100));
    expect(screen.getByRole('status').textContent).toContain('Recovering figure');
    act(() => jest.advanceTimersByTime(250));
    expect(screen.getByRole('status').textContent).toContain('Recovering figure');
    act(() => jest.advanceTimersByTime(500));
    expect(screen.getByRole('status').textContent).toContain('Recovering figure');
    act(() => jest.advanceTimersByTime(1000));
    expect(screen.getByText('Recovered plot')).not.toBeNull();
  });

  test('retains a manual retry for a persistent rendering failure', () => {
    class BrokenFigure extends React.Component {
      componentDidMount() {
        throw new Error('persistent failure');
      }

      render() {
        return <div>Broken plot</div>;
      }
    }

    render(
      <FigureErrorBoundary figureId="broken">
        <BrokenFigure />
      </FigureErrorBoundary>
    );

    for (const delay of [100, 250, 500, 1000]) {
      act(() => jest.advanceTimersByTime(delay));
    }
    expect(screen.getByRole('alert').textContent).toContain(
      'This figure could not be displayed.'
    );
    expect(screen.getByText('Retry')).not.toBeNull();
  });
});
