import {
  findByLabelText,
  findByRole,
  queryByRole,
  waitFor
} from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { updateSWMock } from '../mocks/register-sw-mock.js';
import { mockLocationObject, renderApp, unmountApp } from '../utils.js';

class ServiceWorkerMock {}
let originalServiceWorker;
const updateAvailableMessage = 'Update available!';

describe('update notification', () => {
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

  it('crossfades the content before activating the updated service worker', async () => {
    await renderApp();
    await userEvent.click(
      await findByRole(document.body, 'heading', {
        name: updateAvailableMessage
      })
    );

    expect(
      await findByRole(document.body, 'heading', { name: 'Updating...' })
    ).toBeInTheDocument();
    expect(
      await findByLabelText(document.body, 'Loading...')
    ).toBeInTheDocument();
    expect(
      queryByRole(document.body, 'heading', { name: updateAvailableMessage })
    ).toBeNull();
    expect(updateSWMock).not.toHaveBeenCalled();

    await waitFor(() => {
      expect(updateSWMock).toHaveBeenCalled();
    });
  });

  it('activates the updated service worker after the CSS crossfade', async () => {
    await renderApp();
    await userEvent.click(
      await findByRole(document.body, 'heading', {
        name: updateAvailableMessage
      })
    );

    expect(
      await findByRole(document.body, 'heading', { name: 'Updating...' })
    ).toBeInTheDocument();
    expect(updateSWMock).not.toHaveBeenCalled();
    await waitFor(() => {
      expect(updateSWMock).toHaveBeenCalledOnce();
    });
    expect(
      await findByLabelText(document.body, 'Loading...')
    ).toBeInTheDocument();
  });

  it('does not show without a service worker in local development', async () => {
    // Remove the development service-worker opt-in so registration is skipped
    sessionStorage.removeItem('sw');
    await renderApp();

    expect(
      queryByRole(document.body, 'heading', { name: updateAvailableMessage })
    ).toBeNull();
    expect(updateSWMock).not.toHaveBeenCalled();
  });

  it('ignores repeat clicks while the service worker is updating', async () => {
    await renderApp();
    const notification = document.querySelector('.update-notification');

    await userEvent.click(notification);
    await userEvent.click(notification);

    await waitFor(() => {
      expect(updateSWMock).toHaveBeenCalledOnce();
    });
  });
});
