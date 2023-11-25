import Emitter from 'tiny-emitter';
import AutocompletionWorker from '../autocompletion-worker.js?worker';
import appStorage from './app-storage.js';

class EditorAutocompleter extends Emitter {
  constructor({ autocompleteMode } = {}) {
    super();
    this.mode = autocompleteMode;
    this.cancel();
    // Use a web worker to perform the computationally-heavy work of processing
    // terms, which may involve processing thousands of words within the user's
    // log entries
    this.setMode(autocompleteMode);
  }

  setMode(newMode) {
    this.mode = newMode;
    if (
      appStorage.usingIDB() &&
      newMode !== 'off' &&
      typeof Worker !== 'undefined'
    ) {
      this.worker = new AutocompletionWorker();
      this.worker.onmessage = (event) => {
        this.receiveCompletions(event);
      };
    } else {
      if (this.worker) {
        this.worker.terminate();
        delete this.worker;
      }
    }
  }

  get isEnabled() {
    return this.mode !== 'off';
  }

  // Dismiss the current completion suggestion
  cancel() {
    this.isReady = false;
    this.matchingCompletion = '';
    this.completionPlaceholder = '';
    this.emit('cancel');
  }

  // Since the Quill editor is loaded asynchronously apart from this
  // autocomplete engine, we have a dedicated function to set the editor as
  // soon as it is ready
  setEditor(editor) {
    this.editor = editor;
  }

  // Compute the currently-typed term (can be more than one word) for which to
  // show suggestions of what the user may be typing
  getCompletionQuery() {
    if (!this.editor) {
      return '';
    }
    const editorSelection = this.editor.getSelection();
    // Do not autocomplete anything if multiple characters of text are actually
    // selected
    if (!editorSelection || editorSelection.length > 0) {
      return '';
    }
    const editorText = this.editor.getText();
    // Do not attempt to autocomplete when text cursor is between letters
    if (editorText[editorSelection.index] !== '\n') {
      return '';
    }
    const characters = [];
    for (let i = editorSelection.index - 1; i >= 0; i -= 1) {
      const character = editorText[i];
      // Only search back to the beginning of the line (and let the worker
      // decide which terms on that line are relevant for the autocompletion)
      if (character === '\n') {
        break;
      }
      characters.unshift(character);
    }
    return characters.join('');
  }

  // Receive the top suggestion of the autocompletion that best matches what
  // the user is currently typing, and any other data that may be relevant for
  // that purpose
  receiveCompletions(event) {
    this.matchingCompletion = event.data.matchingCompletion;
    this.completionPlaceholder = event.data.completionPlaceholder;
    this.emit('receive', this.completionPlaceholder);
  }

  // Fetch autocompletion matches for the currently-typed line of text (the
  // query)
  fetchCompletions() {
    const completionQuery = this.getCompletionQuery();
    // An optimization to handle the common case where the user types "into" the
    // placeholder text, one character at a time, meaning that the full
    // completion will not change; therefore, we can skip calling out to the
    // worker in this case and simply perform the substring math to compute the
    // new placeholder text directly
    if (
      completionQuery + this.completionPlaceholder.slice(1) ===
      this.matchingCompletion
    ) {
      this.receiveCompletions({
        data: {
          matchingCompletion: this.matchingCompletion,
          completionPlaceholder: this.completionPlaceholder.slice(1)
        }
      });
      return;
    }
    if (!completionQuery) {
      // Don't bother to fetch completions if the current line is blank, or if
      // the cursor is not at the end of the line
      this.cancel();
      return;
    }
    if (this.worker && this.isEnabled) {
      this.isReady = true;
      this.worker.postMessage({
        completionQuery,
        autocompleteMode: this.mode
      });
    }
  }
}

export default EditorAutocompleter;
