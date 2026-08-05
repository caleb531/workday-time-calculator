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
});
