import React from 'react';
import { Sliders } from 'lucide-react';
import SettingField from './forms/SettingField';

export default class SettingsMenu extends React.Component {
  state = { showAdvanced: false };

  render() {
    const {
      figureType,
      settings = {},
      schema = {},
      onChange = () => {},
      onApply = () => {},
      onDelete = () => {},
    } = this.props;
    const hasAdvanced = Object.values(schema).some((metadata) => metadata.advanced);
    const visibleSettings = Object.entries(settings).filter(([key]) => (
      !schema[key]?.advanced || this.state.showAdvanced
    ));

    return (
      <aside
        className="figure-settings no-drag"
        onClick={(event) => event.stopPropagation()}
      >
        {figureType?.label && (
          <div className="figure-settings-type">
            <span>Figure type</span>
            <strong>{figureType.label}</strong>
            <code>{figureType.id}</code>
          </div>
        )}
          <div className="figure-settings-fields">
            {visibleSettings.map(([key, value]) => (
              <SettingField
                key={key}
                name={key}
                value={value}
                metadata={schema[key] || {}}
                onChange={onChange}
              />
            ))}
          </div>

          {hasAdvanced && (
            <button
              className="button button-secondary figure-settings-advanced"
              type="button"
              onClick={() => this.setState((state) => ({ showAdvanced: !state.showAdvanced }))}
            >
              <Sliders size={15} />
              {this.state.showAdvanced ? 'Hide advanced' : 'Show advanced'}
            </button>
          )}

          <div className="figure-settings-actions">
            <button className="button button-danger" type="button" onClick={onDelete}>Delete</button>
            <button className="button button-primary" type="button" onClick={onApply}>Apply</button>
          </div>
      </aside>
    );
  }
}
