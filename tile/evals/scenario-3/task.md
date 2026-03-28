# Warp Boost Button Component

Build a React component that provides a warp/boost trigger button with cooldown enforcement, preventing re-triggering until the cooldown period has elapsed.

## Capabilities

### Warp Initiation with Cooldown

Implement a boost button that correctly interfaces with the warp initiation system:

- Clicking the boost button when not warping and cooldown has elapsed triggers the warp sequence and sets `isWarping` to `true` [@test](./tests/warp-triggers.test.tsx)
- Clicking the button while `isWarping` is `true` has no effect (warp cannot be re-triggered mid-sequence) [@test](./tests/warp-no-retrigger.test.tsx)
- The button becomes disabled while `isWarping` is `true` and re-enables after `isWarping` returns to `false` [@test](./tests/warp-button-disabled.test.tsx)
- The button displays a visual indicator of the current warp state (idle vs active) [@test](./tests/warp-button-label.test.tsx)

## Implementation

[@generates](./src/WarpBoostButton.tsx)

## API

```typescript { #api }
interface WarpBoostButtonProps {
  isWarping?: boolean;
  onBoost?: () => void;
}

export function WarpBoostButton(props: WarpBoostButtonProps): JSX.Element;
```

## Dependencies { .dependencies }

### timeverse 0.0.0 { .dependency }

Provides `initiateWarp` action via `useWormholeActions`, `isWarping` state via `useWormholeState`, and `WARP_CONFIG.COOLDOWN` constant for the 2000ms cooldown between warp sequences.

[@satisfied-by](timeverse)
