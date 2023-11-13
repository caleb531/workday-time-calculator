import { waitFor } from '@testing-library/dom';
import {
  clickPreferenceOption,
  openPreferences,
  renderApp,
  setPreferences,
  unmountApp
} from '../utils.js';

const S_IN_M = 60;
const MS_IN_S = 1000;

describe('reminder system', () => {
  beforeEach(async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });
  afterEach(async () => {
    vi.useRealTimers();
    await unmountApp();
    Notification._resetPermissions();
  });

  it('should enable reminders', async () => {
    await renderApp();
    await openPreferences();
    Notification._grantWhenRequested();
    await clickPreferenceOption('Reminder Interval', 'Every 15 minutes');
    expect(Notification).toHaveBeenCalledWith('Workday Time Calculator', {
      body: 'Reminder set to show every 15 minutes!',
      icon: 'app-icon.png'
    });
    expect(Notification).toHaveBeenCalledTimes(1);
  });
  it('should request permissions if preference is enabled but permissions have not yet been requested', async () => {
    vi.spyOn(Notification, 'requestPermission');
    await setPreferences({ reminderInterval: 15 });
    await renderApp();
    await waitFor(() => {
      expect(Notification.requestPermission).toHaveBeenCalled();
    });
  });
  it('should spawn 15-minute reminder when 15 minutes elapses', async () => {
    const minutes = 15;
    await renderApp();
    await openPreferences();
    Notification._grantWhenRequested();
    await clickPreferenceOption(
      'Reminder Interval',
      `Every ${minutes} minutes`
    );
    vi.advanceTimersByTime(minutes * S_IN_M * MS_IN_S);
    expect(Notification).toHaveBeenCalledWith('Workday Time Calculator', {
      body: 'Remember to update your log!',
      icon: 'app-icon.png'
    });
    expect(Notification).toHaveBeenCalledTimes(2);
  });
});
