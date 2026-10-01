import Emitter from 'tiny-emitter';

// Coordinate exclusive app ownership without coupling it to rendering or startup
class AppLock extends Emitter {
  // Give each app instance its own acquisition and teardown lifecycle
  constructor() {
    super();
    // Keep consumers waiting until acquisition or fallback permits startup
    this.status = 'checking';
    // Use the same browser-wide name across all instances of the application
    this.lockName = 'workday-time-calculator';
    // Prevent repeated startup calls from creating competing requests
    this.isStarted = false;
    // Ignore asynchronous results after the owning component has been removed
    this.isDisposed = false;
    // Cancel only queued requests; immediate checks cannot accept a signal
    this.abortController = null;
    // Retain the callback that resolves the promise holding acquired ownership
    this.releaseLock = null;
  }

  // Begin acquisition once; unsupported browsers permit normal startup immediately
  start() {
    if (this.isStarted || this.isDisposed) {
      return;
    }
    this.isStarted = true;
    if (!navigator.locks) {
      this.setStatus('ready');
      return;
    }
    this.abortController = new AbortController();
    this.requestOwnership();
  }

  // Notify consumers only after a live model has entered a different status
  setStatus(status) {
    if (this.isDisposed || this.status === status) {
      return;
    }
    this.status = status;
    this.emit('change', status);
  }

  // Check immediately first; a duplicate instance then queues for fresh startup
  async requestOwnership(wait = false) {
    if (this.isDisposed) {
      return;
    }
    try {
      await navigator.locks.request(
        this.lockName,
        {
          mode: 'exclusive',
          // Web Locks rejects combining ifAvailable and signal in one request
          ...(wait
            ? { signal: this.abortController.signal }
            : { ifAvailable: true })
        },
        // Return a pending promise to hold ownership until explicit disposal
        (lock) => {
          if (this.isDisposed) {
            return;
          }
          if (!lock) {
            this.setStatus('blocked');
            this.requestOwnership(true);
            return;
          }
          return new Promise((resolve) => {
            // Register release before notifying listeners that might dispose us
            this.releaseLock = resolve;
            // Queued ownership requires a reload rather than enabling stale state
            this.setStatus(wait ? 'reloading' : 'ready');
          });
        }
      );
    } catch (error) {
      if (this.isDisposed) {
        return;
      }
      console.error(error);
      this.setStatus('ready');
    }
  }

  // Cancel waiting, release held ownership, and remove every registered listener
  dispose() {
    if (this.isDisposed) {
      return;
    }
    this.isDisposed = true;
    this.abortController?.abort();
    this.releaseLock?.();
    this.releaseLock = null;
    // TinyEmitter stores all event listeners in this registry
    this.e = {};
  }
}

export default AppLock;
