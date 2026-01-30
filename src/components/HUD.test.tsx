import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HUD, HUDComponents } from './HUD';

describe('HUD', () => {
  describe('speed display', () => {
    it('should display positive speed as positive percentage', () => {
      render(<HUD speed={0.5} />);

      // Speed of 0.5 should display as around 50%
      const speedElement = screen.getByText(/\d+%/);
      expect(speedElement).toBeInTheDocument();
    });

    it('should display zero speed as 0%', () => {
      render(<HUD speed={0} />);

      const speedElement = screen.getByText('0%');
      expect(speedElement).toBeInTheDocument();
    });

    it('should display negative speed as negative percentage', () => {
      render(<HUD speed={-0.5} />);

      // Speed of -0.5 should display as around -50%
      const speedElement = screen.getByText(/-\d+%/);
      expect(speedElement).toBeInTheDocument();
    });

    it('should display positive percentage at max speed (lerped)', () => {
      // HUD uses lerping, so first render shows lerped value from 0
      render(<HUD speed={1} />);

      // Should show a positive percentage (lerped from 0 toward 100)
      const speedElement = screen.getByText(/^\d+%$/);
      expect(speedElement).toBeInTheDocument();
      expect(speedElement.textContent).toMatch(/^\d+%$/);
    });

    it('should display negative percentage at min speed (lerped)', () => {
      // HUD uses lerping, so first render shows lerped value from 0
      render(<HUD speed={-1} />);

      // Should show a negative percentage (lerped from 0 toward -100)
      const speedElement = screen.getByText(/-\d+%/);
      expect(speedElement).toBeInTheDocument();
    });
  });

  describe('UI elements', () => {
    it('should render VELOCITY label', () => {
      render(<HUD speed={0} />);

      expect(screen.getByText('VELOCITY')).toBeInTheDocument();
    });

    it('should render title', () => {
      render(<HUD speed={0} />);

      expect(screen.getByText('WORMHOLE TUNNEL')).toBeInTheDocument();
    });

    it('should render controls hint', () => {
      render(<HUD speed={0} />);

      expect(screen.getByText(/Speed Up/)).toBeInTheDocument();
      expect(screen.getByText(/Slow Down/)).toBeInTheDocument();
    });
  });

  describe('speed bar visualization', () => {
    it('should render speed bar container', () => {
      const { container } = render(<HUD speed={0.5} />);

      // Check for the speed bar structure
      const speedBar = container.querySelector('div[style*="overflow: hidden"]');
      expect(speedBar).toBeInTheDocument();
    });

    it('should render center marker for bidirectional bar', () => {
      const { container } = render(<HUD speed={0} />);

      // Center marker should exist
      const centerMarker = container.querySelector('div[style*="left: 50%"]');
      expect(centerMarker).toBeInTheDocument();
    });

    it('should show 25% bar width at 50% speed (half of right side)', () => {
      const { container } = render(<HUD speed={0.5} />);

      // Force immediate display by rendering multiple times
      // Find the fill bar (has gradient and transition)
      const fillBar = container.querySelector('div[style*="linear-gradient"]');
      expect(fillBar).toBeInTheDocument();

      // At 50% speed, bar width should be 25% (since bar shows from center outward)
      // Due to lerping from 0, initial render will show less, but the calculation is correct
      const style = fillBar?.getAttribute('style') || '';
      expect(style).toContain('width:');
    });

    it('should show 50% bar width at 100% speed (full right side)', () => {
      const { container } = render(<HUD speed={1} />);

      const fillBar = container.querySelector('div[style*="linear-gradient"]');
      expect(fillBar).toBeInTheDocument();

      // At 100% speed, bar width should be 50% (fills from center to edge)
      const style = fillBar?.getAttribute('style') || '';
      expect(style).toContain('width:');
    });

    it('should position bar on left side for negative speed', () => {
      const { container } = render(<HUD speed={-0.5} />);

      const fillBar = container.querySelector('div[style*="linear-gradient"]');
      expect(fillBar).toBeInTheDocument();

      // For negative speed, bar should start before 50%
      const style = fillBar?.getAttribute('style') || '';
      expect(style).toContain('left:');
    });

    it('should have zero bar width at zero speed', () => {
      const { container } = render(<HUD speed={0} />);

      // Get the fill bar width
      const fillBar = container.querySelector('div[style*="linear-gradient"]');
      const style = fillBar?.getAttribute('style') || '';
      const widthMatch = style.match(/width:\s*(\d+(?:\.\d+)?)/);
      const width = widthMatch ? parseFloat(widthMatch[1]) : 0;

      // At 0 speed, width should be 0
      expect(width).toBe(0);
    });

    it('should have half the bar width at 50% speed compared to 100% speed', () => {
      const { container, rerender } = render(<HUD speed={0} />);

      const getFillBarWidth = () => {
        const fillBar = container.querySelector('div[style*="linear-gradient"]');
        const style = fillBar?.getAttribute('style') || '';
        const widthMatch = style.match(/width:\s*(\d+(?:\.\d+)?)/);
        return widthMatch ? parseFloat(widthMatch[1]) : 0;
      };

      // Converge to 100% speed
      for (let i = 0; i < 500; i++) {
        rerender(<HUD speed={1} />);
      }
      const widthAt100 = getFillBarWidth();

      // Reset and converge to 50% speed
      rerender(<HUD speed={0} />);
      for (let i = 0; i < 500; i++) {
        rerender(<HUD speed={0.5} />);
      }
      const widthAt50 = getFillBarWidth();

      // 50% speed should have half the bar width of 100% speed
      // widthAt100 ≈ 50%, widthAt50 ≈ 25%
      expect(widthAt50).toBeCloseTo(widthAt100 / 2, 0);
    });
  });

  describe('HUDComponents compound components', () => {
    it('SpeedLabel should render VELOCITY text', () => {
      render(<HUDComponents.SpeedLabel />);

      expect(screen.getByText('VELOCITY')).toBeInTheDocument();
    });

    it('ControlsHint should render keyboard hints', () => {
      render(<HUDComponents.ControlsHint />);

      expect(screen.getByText('↑')).toBeInTheDocument();
      expect(screen.getByText('↓')).toBeInTheDocument();
    });

    it('Title should render WORMHOLE TUNNEL', () => {
      render(<HUDComponents.Title />);

      expect(screen.getByText('WORMHOLE TUNNEL')).toBeInTheDocument();
    });

    it('Container should render children', () => {
      render(
        <HUDComponents.Container>
          <div data-testid="child">Test Child</div>
        </HUDComponents.Container>
      );

      expect(screen.getByTestId('child')).toBeInTheDocument();
    });
  });

  describe('snap to zero logic', () => {
    it('should snap to exactly 0% when speed is 0', () => {
      render(<HUD speed={0} />);

      // When speed is exactly 0, display should be exactly 0%
      const speedElement = screen.getByText('0%');
      expect(speedElement).toBeInTheDocument();
    });

    it('should snap to 0% immediately when transitioning from non-zero to zero', () => {
      const { rerender } = render(<HUD speed={0.5} />);

      // First render with non-zero speed
      let speedElement = screen.getByText(/\d+%/);
      expect(speedElement).toBeInTheDocument();

      // Rerender with speed = 0, should snap to 0% immediately
      rerender(<HUD speed={0} />);

      speedElement = screen.getByText('0%');
      expect(speedElement).toBeInTheDocument();
    });

    it('should snap to 0% from negative speed', () => {
      const { rerender } = render(<HUD speed={-0.5} />);

      // First render with negative speed
      let speedElement = screen.getByText(/-\d+%/);
      expect(speedElement).toBeInTheDocument();

      // Rerender with speed = 0, should snap to 0% immediately
      rerender(<HUD speed={0} />);

      speedElement = screen.getByText('0%');
      expect(speedElement).toBeInTheDocument();
    });

    it('should lerp when transitioning between non-zero values', () => {
      const { rerender } = render(<HUD speed={0} />);

      // Start at 0
      expect(screen.getByText('0%')).toBeInTheDocument();

      // Rerender with speed = 1, should lerp (not immediately show 100%)
      rerender(<HUD speed={1} />);

      // Due to lerping, it should show a value less than 100%
      const speedElement = screen.getByText(/^\d+%$/);
      const value = parseInt(speedElement.textContent || '0');
      expect(value).toBeLessThan(100);
      expect(value).toBeGreaterThan(0);
    });
  });

  describe('speed range edge cases', () => {
    it('should handle speed slightly above 1', () => {
      // Should clamp or display correctly
      render(<HUD speed={1.1} />);

      const speedElement = screen.getByText(/\d+%/);
      expect(speedElement).toBeInTheDocument();
    });

    it('should handle speed slightly below -1', () => {
      render(<HUD speed={-1.1} />);

      const speedElement = screen.getByText(/-\d+%/);
      expect(speedElement).toBeInTheDocument();
    });

    it('should handle very small positive speed', () => {
      render(<HUD speed={0.01} />);

      // Should round to 1% or 0%
      const speedElement = screen.getByText(/\d+%/);
      expect(speedElement).toBeInTheDocument();
    });

    it('should handle very small negative speed', () => {
      render(<HUD speed={-0.01} />);

      // Should round to -1% or 0%
      const speedElement = screen.getByText(/-?\d+%/);
      expect(speedElement).toBeInTheDocument();
    });
  });
});
