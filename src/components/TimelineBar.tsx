export interface FormationMeta {
  id: string;
  name: string;
}

interface Props {
  formations: FormationMeta[];
  current: number;
  onSelect: (index: number) => void;
  onAdd: () => void;
}

export default function TimelineBar({
  formations,
  current,
  onSelect,
  onAdd,
}: Props) {
  return (
    <footer
      style={{
        padding: '0.5rem',
        background: '#F5F5F5',
        display: 'flex',
        gap: '0.5rem',
        overflowX: 'auto',
        alignItems: 'center',
      }}
    >
      {formations.map((f, idx) => (
        <button
          key={f.id}
          onClick={() => onSelect(idx)}
          style={{
            padding: '0.25rem 0.75rem',
            borderRadius: 6,
            border: 'none',
            cursor: 'pointer',
            background: idx === current ? '#1982C4' : '#bdbdbd',
            color: '#fff',
            whiteSpace: 'nowrap',
          }}
        >
          {f.name}
        </button>
      ))}

      {/* ＋ボタン */}
      <button
        onClick={onAdd}
        style={{
          padding: '0.25rem 0.75rem',
          borderRadius: 6,
          border: 'none',
          cursor: 'pointer',
          background: '#8AC926',
          color: '#fff',
          fontWeight: 'bold',
        }}
      >
        ＋
      </button>
    </footer>
  );
}
