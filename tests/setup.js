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
  width: 10,
  height: 10,
  top: 10,
  right: 10,
  bottom: 20,
  left: 20
}));
