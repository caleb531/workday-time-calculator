import {
  findByRole,
  findByTestId,
  queryByRole,
  queryByTestId,
  queryByText,
  waitFor
} from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import m from 'mithril';
import AppComponent from '../../scripts/components/app.jsx';
import Preferences from '../../scripts/models/preferences.js';
import { renderApp, unmountApp } from '../utils.js';

// Use the public lock name to simulate another tab holding app ownership
const lockName = 'workday-time-calculator';

// Occupy the browser lock until the caller chooses to close the simulated original tab
async function openOtherTab() {
  // Retain the completion callback so tests can release the competing owner
  let release;
  navigator.locks.request(lockName, {}, () => {
    return new Promise((resolve) => {
      release = resolve;
    });
  });
  await waitFor(() => expect(release).toBeTypeOf('function'));
  return release;
}

describe('app ownership', () => {
  afterEach(async () => {
    await unmountApp();
  });

  it('keeps startup pending until ownership is established', async () => {
    // Delay the browser callback to inspect the app before ownership is known
    let grant;
    navigator.locks.request.mockImplementation((name, options, callback) => {
      return new Promise((resolve) => {
        grant = () => resolve(callback({ name }));
      });
    });
    // Preference validation may write to storage, so loading must also be deferred
    const load = vi.spyOn(Preferences.prototype, 'load');
    await renderApp();
    expect(load).not.toHaveBeenCalled();
    expect(queryByTestId(document.body, 'log-editor')).toBeNull();
    expect(
      queryByRole(document.body, 'button', { name: 'Toggle Tools Menu' })
    ).toBeNull();
    expect(queryByRole(document.body, 'dialog')).toBeNull();
    grant();
    expect(await findByTestId(document.body, 'log-editor')).toBeInTheDocument();
  });

  it('initializes the owning tab and holds its lock until unmount', async () => {
    await renderApp();
    expect(await findByTestId(document.body, 'log-editor')).toBeInTheDocument();
    expect(navigator.locks.owner).not.toBeNull();
    expect(navigator.locks.request).toHaveBeenCalledWith(
      lockName,
      expect.objectContaining({ mode: 'exclusive', ifAvailable: true }),
      expect.any(Function)
    );
    expect(
      queryByRole(document.body, 'dialog', { name: 'Already Open' })
    ).toBeNull();
    // Leave the test root attached so shared cleanup can still find it
    m.mount(document.querySelector('main'), null);
    await waitFor(() => expect(navigator.locks.owner).toBeNull());
  });

  it('preserves the original editor when another app instance opens', async () => {
    await renderApp();
    // Retain the original editor node to verify it is not replaced or disabled
    const editor = await findByTestId(document.body, 'log-editor');
    // Mount a second app against the same lock manager to simulate a duplicate tab
    const secondRoot = document.createElement('main');
    document.body.appendChild(secondRoot);
    try {
      m.mount(secondRoot, AppComponent);
      expect(
        await findByRole(secondRoot, 'dialog', { name: 'Already Open' })
      ).toBeInTheDocument();
      expect(queryByTestId(secondRoot, 'log-editor')).toBeNull();
      expect(editor.querySelector('.ql-editor')).toHaveAttribute(
        'contenteditable',
        'true'
      );
      expect(editor).toBeInTheDocument();
    } finally {
      m.mount(secondRoot, null);
      secondRoot.remove();
    }
  });

  it('ignores an acquisition callback delivered after unmount', async () => {
    // Hold the acquisition callback until the app has been removed
    let grant;
    navigator.locks.request.mockImplementation((name, options, callback) => {
      return new Promise((resolve) => {
        grant = () => resolve(callback({ name }));
      });
    });
    // Confirm that a late grant does not load or correct persisted preferences
    const load = vi.spyOn(Preferences.prototype, 'load');
    await renderApp();
    m.mount(document.querySelector('main'), null);
    grant();
    await Promise.resolve();
    expect(load).not.toHaveBeenCalled();
    expect(window.location.reload).not.toHaveBeenCalled();
  });

  it('shows a focused non-dismissable panel without loading preferences or migrating storage', async () => {
    await openOtherTab();
    // Loading preferences can trigger corrective writes even without an editor
    const load = vi.spyOn(Preferences.prototype, 'load');
    localStorage.setItem('wtc-date-test', JSON.stringify('Existing log'));
    await renderApp();
    // Query through the accessible dialog name to verify its heading association
    const panel = await findByRole(document.body, 'dialog', {
      name: 'Already Open'
    });
    expect(load).not.toHaveBeenCalled();
    expect(queryByTestId(document.body, 'log-editor')).toBeNull();
    expect(queryByText(document.body, 'Upgrading Database...')).toBeNull();
    expect(
      queryByRole(document.body, 'button', { name: 'Toggle Tools Menu' })
    ).toBeNull();
    expect(panel.querySelector('button')).toBeNull();
    await userEvent.click(
      document.querySelector('.app-lock .dismissable-overlay')
    );
    await userEvent.keyboard('{Escape}');
    expect(panel).toBeInTheDocument();
    expect(localStorage.getItem('wtc-date-test')).toEqual(
      JSON.stringify('Existing log')
    );
  });

  it('reloads exactly once when the original tab releases ownership', async () => {
    // Close the competing tab only after the blocking panel is mounted
    const release = await openOtherTab();
    await renderApp();
    await findByRole(document.body, 'dialog', { name: 'Already Open' });
    release();
    await waitFor(() => expect(window.location.reload).toHaveBeenCalledOnce());
    expect(queryByTestId(document.body, 'log-editor')).toBeNull();
    expect(navigator.locks.owner).not.toBeNull();
  });

  it('cancels queued acquisition when a blocked app is unmounted', async () => {
    // Keep the competing owner alive until cancellation has removed the waiter
    const release = await openOtherTab();
    await renderApp();
    await findByRole(document.body, 'dialog', { name: 'Already Open' });
    // Inspect teardown through Mithril without removing the shared test root
    m.mount(document.querySelector('main'), null);
    expect(navigator.locks.queue).toHaveLength(0);
    release();
    await waitFor(() => expect(navigator.locks.owner).toBeNull());
    expect(window.location.reload).not.toHaveBeenCalled();
  });

  it('allows normal use when Web Locks is unavailable', async () => {
    Object.defineProperty(navigator, 'locks', { value: undefined });
    await renderApp();
    expect(await findByTestId(document.body, 'log-editor')).toBeInTheDocument();
    expect(queryByRole(document.body, 'dialog')).toBeNull();
  });

  it('allows normal use when a lock request fails unexpectedly', async () => {
    // Silence the expected diagnostic while checking that it records the failure
    const errorLog = vi.spyOn(console, 'error').mockImplementation(() => {});
    // Represent an API failure rather than another tab holding the lock
    const error = new Error('Lock manager unavailable');
    navigator.locks.request.mockRejectedValue(error);
    await renderApp();
    expect(await findByTestId(document.body, 'log-editor')).toBeInTheDocument();
    expect(errorLog).toHaveBeenCalledWith(error);
  });
});
