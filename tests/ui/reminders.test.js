import { waitFor } from '@testing-library/dom';
import {
  clickPreferenceOption,
  openPreferences,
  renderApp,
  setPreferences,
  unmountApp
} from '../utils.js';

describe('color theme', () => {
  afterEach(async () => {
    await unmountApp();
    Notification._resetPermissions();
  });

  it('should enable reminders', async () => {
    await renderApp();
    await openPreferences();
    Notification._grantWhenRequested();
    await clickPreferenceOption('Reminder Interval', 'Every 15 minutes');
  });
  it('should request permissions if preference is enabled but permissions have not yet been requested', async () => {
    vi.spyOn(Notification, 'requestPermission');
    await setPreferences({ reminderInterval: 15 });
    await renderApp();
    await waitFor(() => {
      expect(Notification.requestPermission).toHaveBeenCalled();
    });
  });
});
