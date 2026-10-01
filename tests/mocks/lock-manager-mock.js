// Model exclusive ownership and queued acquisition without relying on browser APIs in JSDOM
class LockManagerMock {
  // Give each test an isolated lock manager and a spy for request assertions
  constructor() {
    // Store the active request until its callback completes
    this.owner = null;
    // Preserve the order of requests waiting for the current owner to finish
    this.queue = [];
    // Allow individual tests to inspect or replace acquisition behavior
    this.request = vi.fn(this.request.bind(this));
  }

  // Immediately report occupied locks or queue requests that are willing to wait
  request(name, options, callback) {
    if (options.signal?.aborted) {
      return Promise.reject(options.signal.reason);
    }
    if (options.ifAvailable && this.owner) {
      return Promise.resolve().then(() => callback(null));
    }
    return new Promise((resolve, reject) => {
      // Retain the callback and completion handlers while acquisition is pending
      const request = { name, options, callback, resolve, reject };
      // Cancellation removes only pending requests; acquired locks finish through their callback
      request.onAbort = () => {
        this.queue = this.queue.filter((pending) => pending !== request);
        reject(options.signal.reason);
      };
      options.signal?.addEventListener('abort', request.onAbort, {
        once: true
      });
      this.queue.push(request);
      this.grantNext();
    });
  }

  // Keep a granted lock occupied until its callback's promise settles
  grantNext() {
    if (this.owner || !this.queue.length) {
      return;
    }
    // Remove the next request from the queue before scheduling its callback
    const request = this.queue.shift();
    this.owner = request;
    request.options.signal?.removeEventListener('abort', request.onAbort);
    Promise.resolve()
      .then(() => request.callback({ name: request.name, mode: 'exclusive' }))
      .then(request.resolve, request.reject)
      .finally(() => {
        this.owner = null;
        this.grantNext();
      });
  }
}

export default LockManagerMock;
