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
])('reminder system with $minutes reminders', ({ label, minutes }) => {
  beforeEach(async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    // Keep interval assertions independent of the wall-clock time at which
    // the test suite happens to run.
    vi.setSystemTime(new Date(2026, 0, 1, 10, 1));
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
    await vi.advanceTimersByTimeAsync((minutes + 1) * S_IN_M * MS_IN_S);
    await waitFor(() => {
      expect(Notification).toHaveBeenCalledWith('Workday Time Calculator', {
        body: 'Remember to update your log!',
        icon: 'app-icon.png'
      });
      expect(Notification).toHaveBeenCalledTimes(2);
    });
  });

  it(`should re-spawn reminder every ${minutes} minutes`, async () => {
    await renderApp();
    await openPreferences();
    Notification._grantWhenRequested();
    await clickPreferenceOption('Reminder Interval', label);
    await vi.advanceTimersByTimeAsync(2 * minutes * S_IN_M * MS_IN_S);
    await waitFor(() => {
      expect(Notification).toHaveBeenCalledWith('Workday Time Calculator', {
        body: 'Remember to update your log!',
        icon: 'app-icon.png'
      });
      expect(Notification).toHaveBeenCalledTimes(3);
    });
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
    await vi.advanceTimersByTimeAsync(minutes * S_IN_M * MS_IN_S);
    await waitFor(() => {
      expect(Notification).toHaveBeenCalledTimes(1);
    });
  });
});

describe('reminder wall-clock alignment', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    // Start just before two 15-minute boundaries to cover the edge case that
    // previously caused intermittent failures in the parameterized tests.
    vi.setSystemTime(new Date(2026, 0, 1, 10, 29, 30));
  });

  afterEach(async () => {
    vi.useRealTimers();
    Notification._resetPermissions();
    await unmountApp();
  });

  it('should spawn every reminder scheduled within the elapsed time', async () => {
    await renderApp();
    await openPreferences();
    Notification._grantWhenRequested();
    await clickPreferenceOption('Reminder Interval', 'Every 15 minutes');
    await vi.advanceTimersByTimeAsync(16 * S_IN_M * MS_IN_S);
    await waitFor(() => {
      expect(Notification).toHaveBeenCalledWith('Workday Time Calculator', {
        body: 'Remember to update your log!',
        icon: 'app-icon.png'
      });
      // One helper notification plus reminders at 10:30 and 10:45 are shown.
      expect(Notification).toHaveBeenCalledTimes(3);
    });
  });
});
