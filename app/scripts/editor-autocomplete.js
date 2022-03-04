import m from 'mithril';

class EditorAutocomplete {

  onbeforeupdate(_, {dom}) {
    this.recalculatePosition(dom);
  }

  recalculatePosition(element) {
    const selection = window.getSelection();
    if (selection.type.toLowerCase() === 'none') {
      return;
    }
    const selectionBounds = selection.getRangeAt(0).getBoundingClientRect();
    const editorBounds = element.parentNode.getBoundingClientRect();
    this.position = {
      top: selectionBounds.top + selectionBounds.height,
      left: Math.min(
        selectionBounds.left,
        editorBounds.right - element.offsetWidth
      )
    };
  }

  shouldShow() {
    return (
      this.position
      &&
      this.position.top
      &&
      this.position.left
      &&
      document.activeElement !== document.body
    );
  }

  view() {
    return m('div.log-editor-autocomplete', {
      class: this.shouldShow() ? 'is-visible' : '',
      style: this.shouldShow() ? {
        top: `${this.position.top}px`,
        left: `${this.position.left}px`
      } : null
    }, [
      m('div', 'Hey')
    ]);
  }

}

export default EditorAutocomplete;
