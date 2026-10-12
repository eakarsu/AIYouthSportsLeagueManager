import React from 'react';
import './AIWorkspace.css';

export default function NativeAIPresets({ presets, onSelect, prerequisite }) {
  return <div className="ai-preset-bar" aria-label="Sample inputs">
    <div><strong>Sample inputs</strong><p>Fill the form, then review before generating.</p>{prerequisite && <p role="status">{prerequisite}</p>}</div>
    <div className="ai-actions">{presets.map((preset, index) => <button type="button" className="btn btn-secondary" key={preset.label} onClick={() => onSelect(index)}>{preset.label}</button>)}</div>
  </div>;
}
