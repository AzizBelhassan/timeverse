# Camera Mode Toggle Component

Build a React component that provides a button to switch between first-person and third-person camera modes, displaying the current active mode.

## Capabilities

### Camera Mode State and Toggle

Implement a camera mode control that uses the wormhole context for mode management:

- The component reads the current camera mode and displays it correctly as either `first-person` or `third-person` [@test](./tests/camera-mode-display.test.tsx)
- Clicking the toggle button calls the camera mode toggle action, which switches mode from first-person to third-person and vice versa [@test](./tests/camera-toggle-action.test.tsx)
- After toggling, the displayed mode reflects the new state on the next render [@test](./tests/camera-mode-update.test.tsx)
- The component starts with the default camera mode as defined by the wormhole context initial state (`first-person`) [@test](./tests/camera-mode-default.test.tsx)

## Implementation

[@generates](./src/CameraModeToggle.tsx)

## API

```typescript { #api }
export function CameraModeToggle(): JSX.Element;
```

## Dependencies { .dependencies }

### timeverse 0.0.0 { .dependency }

Provides `useWormholeState` for reading `cameraMode` ('first-person' | 'third-person') and `useWormholeActions` for the `toggleCameraMode` action callback.

[@satisfied-by](timeverse)
