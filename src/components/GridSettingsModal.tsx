// src/components/GridSettingsModal.tsx
import React, { useState, ChangeEvent } from 'react';

export type StageConfig = {
  rows: number;
  cols: number;
  cellRatio: number;
};

interface Props {
  initial: StageConfig;
  onSave: (cfg: StageConfig) => void;
  onClose: () => void;
}

export default function GridSettingsModal({ initial, onSave, onClose }: Props) {
  const [cfg, setCfg] = useState<StageConfig>(initial);
  const [err, setErr] = useState('');

  const handleNum =
    (key: keyof StageConfig) => (e: ChangeEvent<HTMLInputElement>) =>
      setCfg((p) => ({ ...p, [key]: Number(e.target.value) }));

  const validate = () => {
    if (![cfg.rows, cfg.cols].every((n) => Number.isInteger(n) && n > 0 && n <= 50))
      return 'Rows / Cols must be 1‑50';
    if (cfg.cellRatio <= 0 || cfg.cellRatio > 5) return 'Ratio must be 0 < r ≤ 5';
    return '';
  };

  const handleSave = () => {
    const msg = validate();
    if (msg) {
      setErr(msg);
      return;
    }
    onSave(cfg);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.4)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
      }}
    >
      <div
        style={{
          background: '#fff',
          padding: '2rem',
          borderRadius: '12px',
          width: 'min(90%, 320px)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
        }}
      >
        <h3 style={{ margin: 0 }}>Grid Settings</h3>

        <label>
          Rows&nbsp;
          <input
            type="number"
            min={1}
            max={50}
            value={cfg.rows}
            onChange={handleNum('rows')}
            style={{ width: '5rem', textAlign: 'right' }}
          />
        </label>

        <label>
          Cols&nbsp;
          <input
            type="number"
            min={1}
            max={50}
            value={cfg.cols}
            onChange={handleNum('cols')}
            style={{ width: '5rem', textAlign: 'right' }}
          />
        </label>

        <label>
          Ratio&nbsp;
          <input
            type="number"
            min={0.25}
            max={5}
            step={0.1}
            value={cfg.cellRatio}
            onChange={handleNum('cellRatio')}
            style={{ width: '5rem', textAlign: 'right' }}
          />
        </label>

        {err && <p style={{ color: '#FF595E' }}>{err}</p>}

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
          <button type="button" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            style={{
              background: '#8AC926',
              color: '#fff',
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: 6,
            }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
