import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock WebGL context for Three.js
class _WebGLRenderingContext {}
class _WebGL2RenderingContext {}

// Assign to globals for Three.js
(globalThis as { WebGLRenderingContext?: typeof _WebGLRenderingContext }).WebGLRenderingContext = _WebGLRenderingContext;
(globalThis as { WebGL2RenderingContext?: typeof _WebGL2RenderingContext }).WebGL2RenderingContext = _WebGL2RenderingContext;

// Mock canvas getContext
HTMLCanvasElement.prototype.getContext = vi.fn((contextType: string) => {
  if (contextType === 'webgl' || contextType === 'webgl2') {
    return {
      canvas: document.createElement('canvas'),
      getExtension: vi.fn(),
      getParameter: vi.fn(() => 16),
      getShaderPrecisionFormat: vi.fn(() => ({ precision: 23, rangeMin: 127, rangeMax: 127 })),
      createShader: vi.fn(() => ({})),
      shaderSource: vi.fn(),
      compileShader: vi.fn(),
      getShaderParameter: vi.fn(() => true),
      createProgram: vi.fn(() => ({})),
      attachShader: vi.fn(),
      linkProgram: vi.fn(),
      getProgramParameter: vi.fn(() => true),
      useProgram: vi.fn(),
      getAttribLocation: vi.fn(() => 0),
      getUniformLocation: vi.fn(() => ({})),
      enableVertexAttribArray: vi.fn(),
      vertexAttribPointer: vi.fn(),
      uniform1f: vi.fn(),
      uniform2f: vi.fn(),
      uniform3f: vi.fn(),
      uniform4f: vi.fn(),
      uniformMatrix4fv: vi.fn(),
      createBuffer: vi.fn(() => ({})),
      bindBuffer: vi.fn(),
      bufferData: vi.fn(),
      createTexture: vi.fn(() => ({})),
      bindTexture: vi.fn(),
      texImage2D: vi.fn(),
      texParameteri: vi.fn(),
      activeTexture: vi.fn(),
      viewport: vi.fn(),
      clearColor: vi.fn(),
      clear: vi.fn(),
      enable: vi.fn(),
      disable: vi.fn(),
      blendFunc: vi.fn(),
      depthFunc: vi.fn(),
      cullFace: vi.fn(),
      frontFace: vi.fn(),
      drawArrays: vi.fn(),
      drawElements: vi.fn(),
      createFramebuffer: vi.fn(() => ({})),
      bindFramebuffer: vi.fn(),
      framebufferTexture2D: vi.fn(),
      checkFramebufferStatus: vi.fn(() => 36053),
      deleteShader: vi.fn(),
      deleteProgram: vi.fn(),
      deleteBuffer: vi.fn(),
      deleteTexture: vi.fn(),
      deleteFramebuffer: vi.fn(),
      pixelStorei: vi.fn(),
      generateMipmap: vi.fn(),
      isContextLost: vi.fn(() => false),
    };
  }
  return null;
}) as typeof HTMLCanvasElement.prototype.getContext;

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock requestAnimationFrame
global.requestAnimationFrame = vi.fn((cb) => setTimeout(cb, 16) as unknown as number);
global.cancelAnimationFrame = vi.fn((id) => clearTimeout(id as unknown as NodeJS.Timeout));

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
