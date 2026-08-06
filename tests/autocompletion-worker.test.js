import * as idbKeyval from 'idb-keyval';
import AutocompletionWorker from '../scripts/autocompletion-worker.js?worker';

// Send a worker request and resolve with its asynchronous response payload
function requestCompletion(worker, request) {
  return new Promise((resolve) => {
    worker.onmessage = (event) => {
      resolve(event.data);
    };
    worker.postMessage(request);
  });
}

describe('autocompletion worker', () => {
  let worker;

  beforeEach(async () => {
    await idbKeyval.clear();
    await idbKeyval.set('wtc-date-2026-8-5', {
      ops: [{ insert: 'Getting started\n12\n10\n' }]
    });
    worker = new AutocompletionWorker();
  });

  afterEach(() => {
    worker.terminate();
  });

  it('should return the request ID supplied by the caller', async () => {
    const completion = await requestCompletion(worker, {
      requestId: 42,
      completionQuery: 'Get',
      autocompleteMode: 'lazy'
    });

    expect(completion).toEqual({
      requestId: 42,
      matchingCompletion: 'Getting',
      completionPlaceholder: 'ting'
    });
  });

  it('should retain the existing object-key order when completions tie', async () => {
    const completion = await requestCompletion(worker, {
      requestId: 43,
      completionQuery: '1',
      autocompleteMode: 'lazy'
    });

    expect(completion).toEqual({
      requestId: 43,
      matchingCompletion: '10',
      completionPlaceholder: '0'
    });
  });
});
