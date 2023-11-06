import BlobMock from './mocks/blob-mock.js';
import { mockLocationObject } from './utils.js';

beforeEach(() => {
  URL.createObjectURL = vi.fn();
  Object.defineProperty(window, 'Blob', {
    configurable: true,
    value: BlobMock
  });
  mockLocationObject();
});

// Mock getBoundingClientRect() for a JSDOM environment
Range.prototype.getBoundingClientRect = vi.fn(() => ({
  x: 0,
  y: 0,
  width: 0,
  height: 0,
  top: 0,
  right: 0,
  bottom: 0,
  left: 0
}));
