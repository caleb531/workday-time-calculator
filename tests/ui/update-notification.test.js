import { findByRole, waitFor } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { updateSWMock } from '../mocks/register-sw-mock.js';
import { mockLocationObject, renderApp, unmountApp } from '../utils.js';

class ServiceWorkerMock {}
let originalServiceWorker;
const updateAvailableMessage = 'Update available!';

describe('Update Notification', () => {
  beforeEach(() => {
    mockLocationObject();
    // Mock navigator.serviceWorker
    originalServiceWorker = navigator.serviceWorker;
    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      value: ServiceWorkerMock
    });
    sessionStorage.setItem('sw', 'true');
  });

  afterEach(async () => {
    await unmountApp();
    sessionStorage.removeItem('sw');
    Object.defineProperty(navigator, 'serviceWorker', {
      value: originalServiceWorker
    });
  });

  it('should show', async () => {
    await renderApp();
    expect(
      await findByRole(document.body, 'heading', {
        name: updateAvailableMessage
      })
    ).toBeInTheDocument();
  });

  it('should reload page when service worker is updated', async () => {
    await renderApp();
    await userEvent.click(
      await findByRole(document.body, 'heading', {
        name: updateAvailableMessage
      })
    );
    await waitFor(() => {
      expect(updateSWMock).toHaveBeenCalled();
    });
  });
});
