import type { useState, KeyboardEvent } from 'react';

interface Props {
  initial: string;
  onSave: (name: string) => void;
  onClose: () => void;
}

export default function NameEditModal({ initial, onSave, onClose }: Props) {
  const [name, setName] = useState(initial);
  const [err, setErr] = useState('');

  const validate = (v: string) => (v.trim() === '' ? 'Name required' : '');

  const handleSave = () => {
    const msg = validate(name);
    if (msg) {
      setErr(msg);
      return;
    }
    onSave(name.trim());
  };

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') onClose();
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
          padding: '1.5rem',
          borderRadius: 12,
          width: 'min(90%,280px)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
        }}
      >
        <h3 style={{ margin: 0 }}>Edit Name</h3>

        <input
          autoFocus
          value={name}
          maxLength={8}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={onKey}
          style={{ padding: '0.5rem', fontSize: '1rem' }}
        />

        {err && <p style={{ color: '#FF595E', margin: 0 }}>{err}</p>}

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
          <button type="button" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            style={{
              background: '#1982C4',
              color: '#fff',
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: 6,
              cursor: 'pointer',
            }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
