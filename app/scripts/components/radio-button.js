import m from 'mithril';

class RadioButtonComponent {

  view({attrs: {preferences, preference, option}}) {
    return m('div.radio-button', [
      m('input[type=radio].radio-button-input', {
        name: preference.id,
        id: `${preference.id}-${option.value}`,
        value: option.value,
        checked: (preferences[preference.id] === option.value)
      }),
      m('label.radio-button-icon', {
        for: `${preference.id}-${option.value}`
      }, m('div.radio-button-icon-dot'))
    ]);
  }

}

export default RadioButtonComponent;
