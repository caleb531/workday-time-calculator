import m from 'mithril';
import _ from 'lodash';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';
import EditorAutocompleter from '../models/editor-autocompleter.js';
import EditorAutocompleterComponent from './editor-autocompleter.js';
import appStorage from '../models/app-storage.js';

class EditorComponent {

  oninit({attrs: {preferences, selectedDate, onSetLogContents}}) {
    this.preferences = preferences;
    this.selectedDate = selectedDate.clone();
    this.onSetLogContents = onSetLogContents;
    this.autocompleter = new EditorAutocompleter({
      autocompleteMode: this.preferences.autocompleteMode,
      onReceiveCompletions: () => m.redraw()
    });
    this.preferences.on('change:autocompleteMode', (key, newMode) => {
      this.autocompleter.setMode(newMode);
    });
  }

  onupdate({attrs: {selectedDate}}) {
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
    const completionPlaceholder = this.autocompleter.getCompletionPlaceholder();
    if (completionPlaceholder) {
      this.editor.insertText(range.index, completionPlaceholder + ' ', 'user');
      this.editor.setSelection(range.index + completionPlaceholder.length + 1, 0, 'user');
      this.autocompleter.cancel();
    } else if (options.fallbackBehavior) {
      options.fallbackBehavior();
    }
  }

  initializeEditor(editorContainer) {
    this.editor = new Quill(editorContainer, {
      theme: 'snow',
      placeholder: '1. Category One\n\t\ta. 9 to 12:15\n\t\t\t\ti. Did this\n2. Category Two\n\t\ta. 12:45 to 5\n\t\t\t\ti. Did that',
      formats: ['list', 'indent'],
      modules: {
        toolbar: [
          [
            {'list': 'bullet'},
            {'list': 'ordered'}
          ],
          [
            {'indent': '-1'},
            {'indent': '+1'}
          ],
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
                    this.editor.formatLine(range, {'indent': '+1'}, 'user');
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
                      this.editor.setSelection(range.index + range.length, 0, 'user');
                    } else {
                      this.editor.setSelection(range.index + range.length + 1, 0, 'user');
                    }
                  }
                });
              }
            },
            shiftTab: {
              key: 9,
              shiftKey: true,
              handler: (range) => {
                this.editor.formatLine(range, {'indent': '-1'}, 'user');
                this.autocompleter.cancel();
              }
            },
            indent: {
              // 221 corresponds to right bracket (']')
              key: 221,
              shortKey: true,
              handler: (range) => {
                this.editor.formatLine(range, {'indent': '+1'}, 'user');
                this.autocompleter.cancel();
              }
            },
            unIndent: {
              // 219 corresponds to left bracket ('[')
              key: 219,
              shortKey: true,
              handler: (range) => {
                this.editor.formatLine(range, {'indent': '-1'}, 'user');
                this.autocompleter.cancel();
              }
            },
            escape: {
              key: 27,
              handler: () => {
                if (this.autocompleter.getCompletionPlaceholder()) {
                  this.autocompleter.cancel();
                  m.redraw();
                }
              }
            }
          }
        }
      },
    });
    this.editor.on('selection-change', () => {
      this.autocompleter.cancel();
      m.redraw();
    });
    // We need to asynchronously defer our text-change handler below with
    // _.debounce() so that the earlier tab-completion handler (which cannot be
    // performed in any less than two atomic operations) can complete before we
    // attempt to fetch completions again; in the case of the tab-completion,
    // this gives time for the selection to be set, just after inserting the
    // completed text
    this.editor.on('text-change', _.debounce((delta, oldDelta, source) => {
      if (source === 'user') {
        let logContents = this.editor.getContents();
        this.onSetLogContents(logContents);
        this.saveTextLog(logContents);
        this.autocompleter.fetchCompletions();
        m.redraw();
      }
      this.editor.focus();
    }));
    this.getLogContentsForSelectedDate().then((logContents) => {
      this.setEditorText(logContents);
    });
    this.autocompleter.setEditor(this.editor);
  }

  getLogContentsForSelectedDate() {
    let dateStorageId = this.getSelectedDateStorageId();
    let logContentsPromise = appStorage.get(dateStorageId);
    try {
      return logContentsPromise.then((logContents) => {
        return logContents || this.getDefaultLogContents();
      });
    } catch (error) {
      return new Promise((resolve) => resolve(this.getDefaultLogContents()));
    }
  }

  getSelectedDateStorageId() {
    return `wtc-date-${this.selectedDate.format('l')}`;
  }

  getDefaultLogContents() {
    return {
      ops: [{
        insert: '\n'
      }]
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
      appStorage.set(this.getSelectedDateStorageId(this.selectedDate), logContents);
    }
  }

  view() {
    return m('div.log-editor-area', [
      m('div.log-editor', {
        oncreate: (vnode) => {
          this.initializeEditor(vnode.dom);
        }
      }),
      this.editor && this.autocompleter.isEnabled ? m(EditorAutocompleterComponent, {
        autocompleter: this.autocompleter
      }) : null
    ]);
  }

}

export default EditorComponent;
