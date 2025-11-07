import React from 'react';
import BaseFigure from './BaseFigure.jsx';
import SettingTypes from '../enums/SettingTypes.js';

export default class Label extends BaseFigure {
  static displayName = 'Label';
  static name = 'Label';

  static get settingSchema() {
    return {
      text: {
        type: SettingTypes.STRING,
        default: 'Click to edit label...',
        label: 'Label Text',
        onChange: 'onTextUpdate',
      },
      fontSize: {
        type: SettingTypes.NUMBER,
        default: 16,
        label: 'Font Size (px)',
        onChange: 'onStyleUpdate',
      },
      fontWeight: {
        type: SettingTypes.STRING,
        default: 'normal',
        label: 'Font Weight',
        onChange: 'onStyleUpdate',
      },
      textAlign: {
        type: SettingTypes.STRING,
        default: 'center',
        label: 'Text Alignment',
        onChange: 'onStyleUpdate',
      },
      color: {
        type: SettingTypes.COLOR,
        default: 'rgba(0,0,0,1)',
        label: 'Text Color',
        onChange: 'onStyleUpdate',
      },
      backgroundColor: {
        type: SettingTypes.COLOR,
        default: 'rgba(255,255,255,0)',
        label: 'Background Color',
        onChange: 'onStyleUpdate',
      },
      padding: {
        type: SettingTypes.NUMBER,
        default: 8,
        label: 'Padding (px)',
        onChange: 'onStyleUpdate',
      },
      borderRadius: {
        type: SettingTypes.NUMBER,
        default: 4,
        label: 'Border Radius (px)',
        onChange: 'onStyleUpdate',
      },
      border: {
        type: SettingTypes.STRING,
        default: 'none',
        label: 'Border (CSS)',
        onChange: 'onStyleUpdate',
      },
    };
  }

  constructor(props) {
    super(props);
    this.state = {
      isEditing: false,
      editText: this.normalizeText(this.settings.text),
    };
    this.textareaRef = React.createRef();
  }

  // Update editText when settings change (important for external settings updates)
  componentDidMount() {
    this.setState({ editText: this.normalizeText(this.settings.text) });
  }

  // Callback methods for settings changes
  onTextUpdate = () => {
    // Update editText state when text setting changes externally
    if (!this.state.isEditing) {
      this.setState({ editText: this.normalizeText(this.settings.text) });
    }
    this.forceUpdate(); // Trigger re-render
  };

  onStyleUpdate = () => {
    // Force re-render for style changes
    this.forceUpdate();
  };

  handleClick = () => {
    this.setState({ 
      isEditing: true, 
      editText: this.normalizeText(this.settings.text) 
    }, () => {
      // Focus and select all text after the textarea is rendered
      if (this.textareaRef.current) {
        this.textareaRef.current.focus();
        this.textareaRef.current.select();
      }
    });
  };

  handleTextChange = (e) => {
    this.setState({ editText: e.target.value });
  };

  handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      // Enter without shift saves the text
      e.preventDefault();
      this.saveText();
    } else if (e.key === 'Escape') {
      // Escape cancels editing
      this.setState({ 
        isEditing: false, 
        editText: this.normalizeText(this.settings.text) 
      });
    }
  };

  handleBlur = () => {
    // Save when clicking outside
    this.saveText();
  };

  saveText = () => {
    const newText = this.state.editText.trim();
    const finalText = newText || 'Click to edit label...';
    
    // Update settings through onSettingsCorrected like other components
    if (typeof this.props.onSettingsCorrected === 'function') {
      const newSettings = { 
        ...this.settings, 
        text: finalText 
      };
      this.props.onSettingsCorrected(newSettings);
    }
    
    this.setState({ isEditing: false });
  };

componentDidUpdate(prevProps, prevState) {
  super.componentDidUpdate(prevProps);

  // Sync text if changed externally
    if (prevProps.settings?.text !== this.props.settings?.text && !this.state.isEditing) {
      this.setState({ editText: this.normalizeText(this.settings.text) });
  }

  // If style props changed, force re-render
  const styleKeys = ['fontSize', 'fontWeight', 'textAlign', 'color', 'backgroundColor', 'padding', 'borderRadius', 'border'];
  if (styleKeys.some(key => prevProps.settings?.[key] !== this.props.settings?.[key])) {
    this.forceUpdate();
  }

  // Auto-resize textarea while editing
  if (this.state.isEditing && this.textareaRef.current && prevState.editText !== this.state.editText) {
    const textarea = this.textareaRef.current;
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
  }
}

  normalizeText(text = '') {
    if (typeof text !== 'string') {
      return '';
    }
    return text.replace(/\\n/g, '\n');
  }

  render() {
    const {
      fontSize,
      fontWeight,
      textAlign,
      color,
      backgroundColor,
      padding,
      borderRadius,
      border,
    } = this.settings;

    const { isEditing, editText } = this.state;
    const displayText = this.normalizeText(this.settings.text || '');

    const wrapperStyle = {
      width: '100%',
      height: '100%',
      padding: '8px',
      boxSizing: 'border-box',
      overflow: 'auto',
    };

    const containerStyle = {
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: textAlign === 'left' ? 'flex-start' : 
                     textAlign === 'right' ? 'flex-end' : 'center',
      padding: `${padding}px`,
      backgroundColor,
      borderRadius: `${borderRadius}px`,
      border,
      cursor: isEditing ? 'text' : 'pointer',
      minHeight: '40px', // Ensure some minimum height
      boxSizing: 'border-box',
    };

    const textStyle = {
      fontSize: `${fontSize}px`,
      fontWeight,
      color,
      textAlign,
      width: '100%',
      wordWrap: 'break-word',
      whiteSpace: 'pre-wrap', // Preserve line breaks
    };

    return (
      <div style={wrapperStyle}>
        {isEditing ? (
          <div style={containerStyle}>
            <textarea
              ref={this.textareaRef}
              value={editText}
              onChange={this.handleTextChange}
              onKeyDown={this.handleKeyDown}
              onBlur={this.handleBlur}
              style={{
                ...textStyle,
                background: 'transparent',
                border: '1px dashed #ccc',
                outline: 'none',
                resize: 'none',
                overflow: 'hidden',
                minHeight: '1.5em',
                borderRadius: '2px',
                padding: '2px 4px',
              }}
              placeholder="Enter your text..."
            />
          </div>
        ) : (
          <div style={containerStyle} onClick={this.handleClick}>
            <div style={textStyle}>
              {displayText || 'Click to edit label...'}
            </div>
          </div>
        )}
      </div>
    );
  }
}
