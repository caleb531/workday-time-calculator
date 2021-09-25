import m from 'mithril';

class ColorSwatchComponent {

  view({attrs: {preferences, preference, option}}) {
    return m('div.color-swatch', [
      m(`label.color-swatch-swatch.color-theme-${option.value}`, {
        for: `${preference.id}-${option.value}`
      })
    ]);
  }

}

export default ColorSwatchComponent;
