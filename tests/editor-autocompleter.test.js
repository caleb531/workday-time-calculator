import EditorAutocompleter from '../scripts/models/editor-autocompleter.js';

describe('editor autocompleter', () => {
  it('should ignore a worker response for an older request', () => {
    const autocompleter = new EditorAutocompleter({
      autocompleteMode: 'lazy'
    });
    // Replace the real worker with a controllable test double after confirming
    // that the initial worker cannot continue doing background work
    autocompleter.terminate();
    const postMessage = vi.fn();
    autocompleter.worker = { postMessage: postMessage };
    const editor = {
      getSelection: vi.fn(() => ({ index: 3, length: 0 })),
      getText: vi.fn(() => 'Get\n')
    };
    autocompleter.setEditor(editor);
    const receiveListener = vi.fn();
    autocompleter.on('receive', receiveListener);

    autocompleter.fetchCompletions();
    editor.getSelection.mockReturnValue({ index: 4, length: 0 });
    editor.getText.mockReturnValue('Gets\n');
    autocompleter.fetchCompletions();

    expect(postMessage).toHaveBeenNthCalledWith(1, {
      requestId: 2,
      completionQuery: 'Get',
      autocompleteMode: 'lazy'
    });
    expect(postMessage).toHaveBeenNthCalledWith(2, {
      requestId: 3,
      completionQuery: 'Gets',
      autocompleteMode: 'lazy'
    });

    autocompleter.receiveCompletions({
      data: {
        requestId: 2,
        matchingCompletion: 'Getting',
        completionPlaceholder: 'ting'
      }
    });

    expect(receiveListener).not.toHaveBeenCalled();
    expect(autocompleter.completionPlaceholder).toBe('');

    autocompleter.receiveCompletions({
      data: {
        requestId: 3,
        matchingCompletion: 'Gets started',
        completionPlaceholder: ' started'
      }
    });

    expect(receiveListener).toHaveBeenCalledWith(' started');
    expect(autocompleter.completionPlaceholder).toBe(' started');

    editor.getSelection.mockReturnValue({ index: 6, length: 0 });
    editor.getText.mockReturnValue('Gets s\n');
    autocompleter.fetchCompletions();

    expect(postMessage).toHaveBeenCalledTimes(2);
    expect(receiveListener).toHaveBeenLastCalledWith('tarted');
    expect(autocompleter.completionPlaceholder).toBe('tarted');
  });

  it('should replace enabled-mode workers and clear the active suggestion', () => {
    const autocompleter = new EditorAutocompleter({
      autocompleteMode: 'lazy'
    });
    const originalWorker = autocompleter.worker;
    const terminateOriginalWorker = vi.spyOn(originalWorker, 'terminate');
    const cancelListener = vi.fn();
    autocompleter.on('cancel', cancelListener);
    autocompleter.isReady = true;
    autocompleter.matchingCompletion = 'Getting started';
    autocompleter.completionPlaceholder = ' started';
    autocompleter.completionQuery = 'Getting';

    autocompleter.setMode('greedy');

    expect(terminateOriginalWorker).toHaveBeenCalledOnce();
    expect(autocompleter.worker).not.toBe(originalWorker);
    expect(autocompleter.mode).toBe('greedy');
    expect(autocompleter.isReady).toBe(false);
    expect(autocompleter.matchingCompletion).toBe('');
    expect(autocompleter.completionPlaceholder).toBe('');
    expect(autocompleter.completionQuery).toBe('');
    expect(cancelListener).toHaveBeenCalledOnce();
  });

  it('should disable autocomplete after an active worker error', () => {
    const autocompleter = new EditorAutocompleter({
      autocompleteMode: 'lazy'
    });
    const worker = autocompleter.worker;
    const terminateWorker = vi.spyOn(worker, 'terminate');
    const postMessage = vi.spyOn(worker, 'postMessage');
    const cancelListener = vi.fn();
    autocompleter.on('cancel', cancelListener);
    autocompleter.isReady = true;
    autocompleter.matchingCompletion = 'Getting started';
    autocompleter.completionPlaceholder = ' started';
    autocompleter.completionQuery = 'Getting';
    autocompleter.setEditor({
      getSelection: vi.fn(() => ({ index: 3, length: 0 })),
      getText: vi.fn(() => 'Get\n')
    });

    worker.onerror(new ErrorEvent('error'));
    autocompleter.fetchCompletions();

    expect(terminateWorker).toHaveBeenCalledOnce();
    expect(autocompleter.worker).toBeUndefined();
    expect(autocompleter.mode).toBe('lazy');
    expect(autocompleter.isReady).toBe(false);
    expect(autocompleter.matchingCompletion).toBe('');
    expect(autocompleter.completionPlaceholder).toBe('');
    expect(cancelListener).toHaveBeenCalledOnce();
    expect(postMessage).not.toHaveBeenCalled();
  });

  it('should ignore an error from a replaced worker', () => {
    const autocompleter = new EditorAutocompleter({
      autocompleteMode: 'lazy'
    });
    const replacedWorker = autocompleter.worker;

    autocompleter.setMode('greedy');

    const activeWorker = autocompleter.worker;
    const terminateActiveWorker = vi.spyOn(activeWorker, 'terminate');
    const cancelListener = vi.fn();
    autocompleter.on('cancel', cancelListener);
    replacedWorker.onerror(new ErrorEvent('error'));

    expect(autocompleter.worker).toBe(activeWorker);
    expect(terminateActiveWorker).not.toHaveBeenCalled();
    expect(cancelListener).not.toHaveBeenCalled();
  });
});
