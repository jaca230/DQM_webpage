import React from 'react';
import SettingTypes from '../../enums/SettingTypes';

export default class SettingField extends React.Component {
  handleChange = (event) => {
    const { type } = this.props.metadata;
    let value = event.target.value;

    if (type === SettingTypes.BOOLEAN) value = event.target.checked;
    if (type === SettingTypes.NUMBER) value = value === '' ? '' : Number(value);
    if (type === SettingTypes.INT) value = value === '' ? '' : parseInt(value, 10);

    this.props.onChange(this.props.name, value);
  };

  render() {
    const { name, value, metadata } = this.props;
    const id = `setting-${name}`;
    const isBoolean = metadata.type === SettingTypes.BOOLEAN;
    const isNumeric = metadata.type === SettingTypes.NUMBER || metadata.type === SettingTypes.INT;

    if (metadata.type === SettingTypes.SELECT) {
      return (
        <label className="form-field" htmlFor={id}>
          <span>{metadata.label || name}</span>
          <select id={id} value={value} onChange={this.handleChange}>
            {(metadata.options || []).map((option) => {
              const optionValue = option.value ?? option;
              return <option key={optionValue} value={optionValue}>{option.label ?? optionValue}</option>;
            })}
          </select>
        </label>
      );
    }

    return (
      <label className={`form-field ${isBoolean ? 'form-field-checkbox' : ''}`} htmlFor={id}>
        <span>{metadata.label || name}</span>
        <input
          id={id}
          type={isBoolean ? 'checkbox' : isNumeric ? 'number' : 'text'}
          checked={isBoolean ? Boolean(value) : undefined}
          value={isBoolean ? undefined : this.formatValue(value)}
          placeholder={metadata.type === SettingTypes.COLOR ? 'rgba(0, 0, 0, 1)' : undefined}
          onChange={this.handleChange}
        />
      </label>
    );
  }

  formatValue(value) {
    if (Array.isArray(value)) return value.join(', ');
    if (value && typeof value === 'object') return JSON.stringify(value);
    return value ?? '';
  }
}
