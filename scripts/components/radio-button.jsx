import m from 'mithril';

class RadioButtonComponent {
  view({ attrs: { preferences, preference, option } }) {
    return (
      <div className="radio-button">
        <input
          type="radio"
          className="radio-button-input"
          name={preference.id}
          id={`${preference.id}-${option.value}`}
          value={option.value}
          checked={preferences[preference.id] === option.value}
        />
        <label className="radio-button-icon" htmlFor={`${preference.id}-${option.value}`}>
          <div className="radio-button-icon-dot" />
        </label>
      </div>
    );
  }
}

export default RadioButtonComponent;
