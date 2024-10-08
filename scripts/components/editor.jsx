import m from 'mithril';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';
import appStorage from '../models/app-storage.js';
import EditorAutocompleter from '../models/editor-autocompleter.js';

class EditorComponent {
  oninit({ attrs: { preferences, selectedDate, onSetLogContents } }) {
    this.preferences = preferences;
    this.selectedDate = selectedDate.clone();
    this.onSetLogContents = onSetLogContents;
    this.autocompleter = new EditorAutocompleter({
      autocompleteMode: this.preferences.autocompleteMode
    });
    this.preferences.on('change:autocompleteMode', (key, newMode) => {
      this.autocompleter.setMode(newMode);
    });
  }

  onupdate({ attrs: { selectedDate } }) {
    if (!selectedDate.isSame(this.selectedDate)) {
      this.selectedDate = selectedDate.clone();
      this.getLogContentsForSelectedDate().then((logContents) => {
        this.setEditorText(logContents);
      });
    }
  }

  // Autocomplete the shown completion, if there is one; if not, run the
  // designated callback as a fallback
  autocomplete(range, options = {}) {
    const completionPlaceholder = this.autocompleter.completionPlaceholder;
    if (completionPlaceholder) {
      // Perform the two atomic operations silently and then trigger the event
      // listeners all at once; this solves a race condition where the
      // text-change event fires before the tab completion operations can finish
      this.editor.insertText(
        range.index,
        completionPlaceholder + ' ',
        'silent'
      );
      this.editor.setSelection(
        range.index + completionPlaceholder.length + 1,
        0,
        'silent'
      );
      this.editor.insertText(range.index, '', 'user');
      this.resetAutocompleteInDOM();
    } else if (options.fallbackBehavior) {
      options.fallbackBehavior();
    }
  }

  // Clean up any leftover autocomplete placeholders in the DOM by clearing all
  // data-autocomplete attributes (except for those elements specified by the
  // optional 'excludeElements' array)
  resetAutocompleteInDOM({ excludeElements = [] } = {}) {
    this.editor.root
      .querySelectorAll('[data-autocomplete]')
      .forEach((element) => {
        if (!excludeElements.includes(element)) {
          element.removeAttribute('data-autocomplete');
          element.removeAttribute('data-testid');
        }
      });
  }

  async initializeEditor(editorContainer) {
    this.editor = new Quill(editorContainer, {
      theme: 'snow',
      placeholder:
        '1. Category One\n\t\ta. 9 to 12:15\n\t\t\t\ti. Did this\n2. Category Two\n\t\ta. 12:45 to 5\n\t\t\t\ti. Did that',
      formats: ['list', 'indent'],
      modules: {
        toolbar: [
          [{ list: 'bullet' }, { list: 'ordered' }],
          [{ indent: '-1' }, { indent: '+1' }]
        ],
        history: {
          // Do not add the editor contents to the Undo history when the app
          // initially loads, or when the selected date changes
          userOnly: true
        },
        keyboard: {
          bindings: {
            // Use <tab> and shift-<tab> to indent/un-indent; these must be
            // defined on editor initialization rather than via
            // keyboard.addBinding (see
            // <https://github.com/quilljs/quill/issues/1647>)
            tab: {
              key: 9,
              handler: (range) => {
                this.autocomplete(range, {
                  fallbackBehavior: () => {
                    this.editor.formatLine(range, { indent: '+1' }, 'user');
                    this.autocompleter.cancel();
                  }
                });
              }
            },
            arrowRight: {
              key: 39,
              handler: (range) => {
                this.autocomplete(range, {
                  fallbackBehavior: () => {
                    if (range.length) {
                      this.editor.setSelection(
                        range.index + range.length,
                        0,
                        'user'
                      );
                    } else {
                      this.editor.setSelection(
                        range.index + range.length + 1,
                        0,
                        'user'
                      );
                    }
                  }
                });
              }
            },
            shiftTab: {
              key: 9,
              shiftKey: true,
              handler: (range) => {
                this.editor.formatLine(range, { indent: '-1' }, 'user');
                this.autocompleter.cancel();
              }
            },
            indent: {
              // 221 corresponds to right bracket (']')
              key: 221,
              shortKey: true,
              handler: (range) => {
                this.editor.formatLine(range, { indent: '+1' }, 'user');
                this.autocompleter.cancel();
              }
            },
            unIndent: {
              // 219 corresponds to left bracket ('[')
              key: 219,
              shortKey: true,
              handler: (range) => {
                this.editor.formatLine(range, { indent: '-1' }, 'user');
                this.autocompleter.cancel();
              }
            },
            escape: {
              key: 27,
              handler: () => {
                if (this.autocompleter.completionPlaceholder) {
                  this.autocompleter.cancel();
                  m.redraw();
                }
              }
            }
          }
        }
      }
    });
    this.editor.on('selection-change', () => {
      this.autocompleter.cancel();
    });
    this.editor.on('text-change', (delta, oldContents, source) => {
      if (source === 'user') {
        let logContents = this.editor.getContents();
        this.onSetLogContents(logContents);
        this.saveTextLog(logContents);
        if (delta.ops[delta.ops.length - 1]?.insert === '\n') {
          // If user enters down to a new line, cancel the current autocomplete
          this.autocompleter.cancel();
        } else if (delta.ops[delta.ops.length - 1]?.delete >= 1) {
          // If the user is deleting any amount of text, then debounce the
          // updating of the autocomplete placeholder to prevent the placeholder
          // text from jittering across successive deletes (e.g. if the user
          // holds down the Delete key)
          this.autocompleter.cancel();
          this.autocompleter.fetchCompletions({ debounce: true });
        } else {
          // Otherwise, fetch normally
          this.autocompleter.fetchCompletions();
        }
        m.redraw();
      }
      // Focus the editor when the page initially loads
      this.editor.focus();
    });
    this.autocompleter.on('receive', (placeholder) => {
      const selection = window.getSelection();
      // Do not calculate anything if the text cursor is not active inside the
      // editor, or if the parent element has not been set yet
      if (selection.type.toLowerCase() === 'none') {
        return;
      }
      const range = selection.getRangeAt(0);
      const autocompleteParentElement =
        range.commonAncestorContainer.parentElement;
      this.resetAutocompleteInDOM({
        // If the parent element remains the same since the last completion,
        // then just reuse it (i.e. don't remove and recreate it)
        excludeElements: [autocompleteParentElement]
      });
      autocompleteParentElement.setAttribute('data-autocomplete', placeholder);
      autocompleteParentElement.setAttribute(
        'data-testid',
        'log-editor-has-autocomplete-active'
      );
    });
    this.autocompleter.on('cancel', () => {
      this.resetAutocompleteInDOM();
    });
    const logContents = await this.getLogContentsForSelectedDate();
    this.setEditorText(logContents);
    this.autocompleter.setEditor(this.editor);
  }

  async getLogContentsForSelectedDate() {
    let dateStorageId = this.getSelectedDateStorageId();
    let logContentsPromise = appStorage.get(dateStorageId);
    try {
      return (await logContentsPromise) || this.getDefaultLogContents();
    } catch (error) {
      return this.getDefaultLogContents();
    }
  }

  getSelectedDateStorageId() {
    return `wtc-date-${this.selectedDate.format('l')}`;
  }

  getDefaultLogContents() {
    return {
      ops: [
        {
          insert: '\n'
        }
      ]
    };
  }

  setEditorText(logContents, source = 'api') {
    this.editor.setContents(logContents, source);
    this.onSetLogContents(logContents);
    m.redraw();
  }

  saveTextLog(logContents) {
    if (logContents.ops.length === 1 && logContents.ops[0].insert === '\n') {
      // If the contents of the current log are empty, delete the entry from
      // localStorage to conserve space
      appStorage.remove(this.getSelectedDateStorageId(this.selectedDate));
    } else {
      appStorage.set(
        this.getSelectedDateStorageId(this.selectedDate),
        logContents
      );
    }
  }

  view() {
    return (
      <div className="log-editor-area">
        <div
          className="log-editor"
          data-testid="log-editor"
          oncreate={(vnode) => {
            this.initializeEditor(vnode.dom);
          }}
        />
      </div>
    );
  }
}

export default EditorComponent;
