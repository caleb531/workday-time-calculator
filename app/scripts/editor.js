import m from 'mithril';
import Quill from 'quill';
import EditorAutocompleter from './models/editor-autocompleter.js';
import EditorAutocompleterComponent from './editor-autocompleter.js';
import appStorage from './models/app-storage.js';

class EditorComponent {

  oninit({attrs: {selectedDate, onSetLogContents}}) {
    this.selectedDate = selectedDate.clone();
    this.onSetLogContents = onSetLogContents;
    this.autocompleter = new EditorAutocompleter();
  }

  onupdate({attrs: {selectedDate}}) {
    if (!selectedDate.isSame(this.selectedDate)) {
      this.selectedDate = selectedDate.clone();
      this.getLogContentsForSelectedDate().then((logContents) => {
        this.setEditorText(logContents);
      });
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
                const completionPlaceholder = this.autocompleter.getCompletionPlaceholder();
                if (completionPlaceholder) {
                  // In order to ensure that fetchCompletions() receives the
                  // correct text cursor position (i.e. the selection), we must
                  // call setSelection() before my text-change handler fires
                  // (which itself triggers whenever insertText with
                  // source:user is called); however, if we precede
                  // setSelection() with a source:user insertText call, then
                  // fetchCompletions() will receive the incorrect selection;
                  // therefore, to solve, we insert the real text silently, set
                  // the selection, *then* trigger a text-change event with
                  // source:user
                  this.editor.insertText(range.index, completionPlaceholder + ' ', 'silent');
                  this.editor.setSelection(range.index + completionPlaceholder.length + 1, 0, 'user');
                  this.editor.insertText(range.index + completionPlaceholder.length + 1, '', 'user');
                  this.autocompleter.cancel();
                } else {
                  this.editor.formatLine(range, {'indent': '+1'}, 'user');
                  this.autocompleter.cancel();
                }
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
    this.editor.on('text-change', (delta, oldDelta, source) => {
      if (source === 'user') {
        let logContents = this.editor.getContents();
        this.onSetLogContents(logContents);
        this.saveTextLog(logContents);
        this.autocompleter.enable();
        this.autocompleter.fetchCompletions();
        m.redraw();
      }
      this.editor.focus();
    });
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
      this.editor ? m(EditorAutocompleterComponent, {
        autocompleter: this.autocompleter
      }) : null
    ]);
  }

}

export default EditorComponent;
