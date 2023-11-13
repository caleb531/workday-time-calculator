import BlobMock from './mocks/blob-mock.js';
import NotificationMock from './mocks/notification-mock.js';
import registerSWMock from './mocks/register-sw-mock.js';
import { mockLocationObject } from './utils.js';

vi.mock('virtual:pwa-register', () => {
  return {
    registerSW: registerSWMock
  };
});

beforeEach(() => {
  URL.createObjectURL = vi.fn();
  Object.defineProperty(window, 'Blob', {
    configurable: true,
    value: BlobMock
  });
  Object.defineProperty(window, 'Notification', {
    configurable: true,
    value: NotificationMock
  });
  mockLocationObject();
});

afterEach(() => {
  vi.restoreAllMocks();
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
