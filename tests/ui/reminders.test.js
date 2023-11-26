import { waitFor } from '@testing-library/dom';
import {
  clickPreferenceOption,
  openPreferences,
  renderApp,
  setPreferences,
  unmountApp
} from '../utils.js';

// Conversion factors
const S_IN_M = 60;
const MS_IN_S = 1000;

describe.each([
  { label: 'Every 15 minutes', minutes: 15 },
  { label: 'Every half-hour', minutes: 30 },
  { label: 'Every hour', minutes: 60 }
])('reminder system with $minutes-minute reminders', ({ label, minutes }) => {
  beforeEach(async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(async () => {
    vi.useRealTimers();
    Notification._resetPermissions();
    await unmountApp();
  });

  it('should enable', async () => {
    await renderApp();
    await openPreferences();
    Notification._grantWhenRequested();
    await clickPreferenceOption('Reminder Interval', label);
    expect(Notification).toHaveBeenCalledWith('Workday Time Calculator', {
      body: `Reminder set to show every ${minutes} minutes!`,
      icon: 'app-icon.png'
    });
    expect(Notification).toHaveBeenCalledTimes(1);
  });

  it('should request permissions if preference is enabled but permissions have not yet been requested', async () => {
    vi.spyOn(Notification, 'requestPermission');
    await setPreferences({ reminderInterval: minutes });
    await renderApp();
    await waitFor(() => {
      expect(Notification.requestPermission).toHaveBeenCalled();
    });
  });

  it(`should spawn reminder when ${minutes} minutes elapses`, async () => {
    await renderApp();
    await openPreferences();
    Notification._grantWhenRequested();
    await clickPreferenceOption('Reminder Interval', label);
    vi.advanceTimersByTime((minutes + 1) * S_IN_M * MS_IN_S);
    expect(Notification).toHaveBeenCalledWith('Workday Time Calculator', {
      body: 'Remember to update your log!',
      icon: 'app-icon.png'
    });
    expect(Notification).toHaveBeenCalledTimes(2);
  });

  it(`should re-spawn reminder every ${minutes} minutes`, async () => {
    await renderApp();
    await openPreferences();
    Notification._grantWhenRequested();
    await clickPreferenceOption('Reminder Interval', label);
    vi.advanceTimersByTime(2 * minutes * S_IN_M * MS_IN_S);
    expect(Notification).toHaveBeenCalledWith('Workday Time Calculator', {
      body: 'Remember to update your log!',
      icon: 'app-icon.png'
    });
    expect(Notification).toHaveBeenCalledTimes(3);
  });

  it('should properly disable after being enabled', async () => {
    await renderApp();
    await openPreferences();
    Notification._grantWhenRequested();
    await clickPreferenceOption('Reminder Interval', label);
    expect(Notification).toHaveBeenCalledWith('Workday Time Calculator', {
      body: `Reminder set to show every ${minutes} minutes!`,
      icon: 'app-icon.png'
    });
    expect(Notification).toHaveBeenCalledTimes(1);
    await clickPreferenceOption('Reminder Interval', 'Never');
    vi.advanceTimersByTime(minutes * S_IN_M * MS_IN_S);
    expect(Notification).toHaveBeenCalledTimes(1);
  });
});
