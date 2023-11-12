import { waitFor } from '@testing-library/dom';
import {
  clickPreferenceOption,
  openPreferences,
  renderApp,
  setPreferences,
  unmountApp
} from '../utils.js';

describe('color theme', () => {
  beforeEach(async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });
  afterEach(async () => {
    await unmountApp();
    Notification._resetPermissions();
    Notification._resetConstructorCalls();
  });

  it('should enable reminders', async () => {
    await renderApp();
    await openPreferences();
    Notification._grantWhenRequested();
    await clickPreferenceOption('Reminder Interval', 'Every 15 minutes');
    expect(Notification._constructorSpy).toHaveBeenCalledWith(
      'Workday Time Calculator',
      {
        body: 'Reminder set to show every 15 minutes!',
        icon: 'app-icon.png'
      }
    );
  });
  it('should request permissions if preference is enabled but permissions have not yet been requested', async () => {
    vi.spyOn(Notification, 'requestPermission');
    await setPreferences({ reminderInterval: 15 });
    await renderApp();
    await waitFor(() => {
      expect(Notification.requestPermission).toHaveBeenCalled();
    });
  });
  it('should spawn reminder when interval elapses', async () => {
    await renderApp();
    await openPreferences();
    Notification._grantWhenRequested();
    await clickPreferenceOption('Reminder Interval', 'Every 15 minutes');
    vi.runOnlyPendingTimers();
    expect(Notification._constructorSpy).toHaveBeenCalledWith(
      'Workday Time Calculator',
      {
        body: 'Remember to update your log!',
        icon: 'app-icon.png'
      }
    );
  });
});
