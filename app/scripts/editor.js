import m from '../../node_modules/mithril/mithril.js';
import Quill from '../../node_modules/quill/dist/quill.js';

class EditorComponent {

  oninit({attrs}) {
    this.selectedDate = attrs.selectedDate;
    this.onSetLogContents = attrs.onSetLogContents;
  }

  onupdate({attrs}) {
    if (!attrs.selectedDate.isSame(this.selectedDate)) {
      this.selectedDate = attrs.selectedDate.clone();
      let logContents = this.getLogContentsForSelectedDate();
      this.setEditorText(logContents);
    }
  }

  initializeEditor(editorContainer) {
    this.editor = new Quill(editorContainer, {
      theme: 'snow',
      placeholder: '1. Red\n\ta. 9 to 12:15\n\t\ti. Did this\n2. Tyme\n\ta. 12:45 to 5\n\t\ti. Did that',
      formats: ['list', 'indent'],
      modules: {
        toolbar: [
          [{'list': 'bullet'}, {'list': 'ordered'}],
          [{'indent': '-1'}, {'indent': '+1'}],
        ],
        keyboard: {
          bindings: {
            // Use <tab> and shift-<tab> to indent/un-indent; these must be
            // defined on editor initialization rather than via
            // keyboard.addBinding (see
            // <https://github.com/quilljs/quill/issues/1647>)
            tab: {
              key: 9,
              handler: (range) => {
                this.editor.formatLine(range, {'indent': '+1'}, 'user');
              }
            },
            shiftTab: {
              key: 9,
              shiftKey: true,
              handler: (range) => {
                this.editor.formatLine(range, {'indent': '-1'}, 'user');
              }
            },
            indent: {
              // 221 corresponds to right bracket (']')
              key: 221,
              shortKey: true,
              handler: (range) => {
                this.editor.formatLine(range, {'indent': '+1'}, 'user');
              }
            },
            unIndent: {
              // 219 corresponds to left bracket ('[')
              key: 219,
              shortKey: true,
              handler: (range) => {
                this.editor.formatLine(range, {'indent': '-1'}, 'user');
              }
            }
          }
        }
      },
    });
    this.editor.on('text-change', (delta, oldDelta, source) => {
      if (source === 'user') {
        let logContents = this.editor.getContents();
        this.onSetLogContents(logContents);
        this.saveTextLog(logContents);
        m.redraw();
      }
      this.editor.focus();
    });
    this.setEditorText(this.getLogContentsForSelectedDate());
  }

  getLogContentsForSelectedDate() {
    let dateStorageId = this.getSelectedDateStorageId();
    let logContentsStr = localStorage.getItem(dateStorageId);
    try {
      return JSON.parse(logContentsStr) || this.getDefaultLogContents();
    } catch (error) {
      return this.getDefaultLogContents();
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

  setEditorText(logContents) {
    this.editor.setContents(logContents);
    this.onSetLogContents(logContents);
  }

  saveTextLog(logContents) {
    localStorage.setItem(this.getSelectedDateStorageId(this.selectedDate), JSON.stringify(logContents));
  }

  view() {
    return m('div.log-editor', {
      oncreate: (vnode) => {
        this.initializeEditor(vnode.dom);
      }
    });
  }

}

export default EditorComponent;
