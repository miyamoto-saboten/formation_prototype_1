import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import GridSettingsModal, { type StageConfig } from '../components/GridSettingsModal';
import CanvasGrid, { type Dancer, type Mode } from '../components/CanvasGrid';
import NameEditModal from '../components/NameEditModal';

const DEFAULT_STAGE: StageConfig = { rows: 10, cols: 15, cellRatio: 1 };
const COLORS = ['#FF595E', '#1982C4', '#6A4C93', '#8AC926', '#FFCA3A'];

export default function EditorPage() {
  /* 初期ステージ設定 --------------------------------------------------- */
  const location = useLocation() as {
    state?: { project?: { stage: StageConfig } };
  };
  const initialStage = location.state?.project?.stage ?? DEFAULT_STAGE;

  /* ステート ----------------------------------------------------------- */
  const [stage, setStage] = useState<StageConfig>(initialStage);
  const [showModal, setShowModal] = useState(false);

  const [dancers, setDancers] = useState<Dancer[]>([]);
  const [nextId, setNextId] = useState(1);

  const [mode, setMode] = useState<Mode>('place');
  const [currentColor, setCurrentColor] = useState(COLORS[0]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showRename, setShowRename] = useState(false);

  /* ダンサー追加 */
  const addDancer = (row: number, col: number) => {
    const id = `D${nextId}`;
    setNextId((n) => n + 1);
    setDancers((prev) => [...prev, { id, name: id, color: currentColor, row, col }]);
  };

  /* ダンサー移動 */
  const moveDancer = (id: string, row: number, col: number) =>
    setDancers((prev) => prev.map((d) => (d.id === id ? { ...d, row, col } : d)));

  /* ダンサー削除 */
  const deleteSelected = () => {
    if (!selectedId) return;
    setDancers((prev) => prev.filter((d) => d.id !== selectedId));
    setSelectedId(null);
  };

  /* Delete / Backspace キーで削除 */
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (
        selectedId &&
        (e.key === 'Delete' || e.key === 'Backspace') &&
        (e.target as HTMLElement)?.tagName !== 'INPUT' // フォーム入力中は無視
      ) {
        e.preventDefault();
        deleteSelected();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedId]);

  /* JSX --------------------------------------------------------------- */
  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* ───────────── ツールバー ───────────── */}
      <header
        style={{
          padding: '0.5rem 1rem',
          background: '#F5F5F5',
          display: 'flex',
          gap: '1rem',
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        {/* モード切替 */}
        <button
          type="button"
          onClick={() => setMode(mode === 'place' ? 'move' : 'place')}
          style={{
            border: 'none',
            padding: '0.5rem 1rem',
            borderRadius: 6,
            cursor: 'pointer',
            background: mode === 'place' ? '#1982C4' : '#FF595E',
            color: '#fff',
          }}
        >
          {mode === 'place' ? '🖊️ Place Mode' : '🖐️ Move Mode'}
        </button>

        {/* カラーパレット */}
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {COLORS.map((c) => (
            <button
              key={c}
              disabled={mode !== 'place'}
              onClick={() => setCurrentColor(c)}
              style={{
                width: 24,
                height: 24,
                borderRadius: '50%',
                border:
                  currentColor === c ? '3px solid #000' : '1px solid #999',
                background: c,
                cursor: mode === 'place' ? 'pointer' : 'not-allowed',
                opacity: mode === 'place' ? 1 : 0.4,
              }}
            />
          ))}
          <span style={{ fontSize: 12 }}>Color</span>
        </div>

        {/* Delete ボタン */}
        <button
          type="button"
          disabled={!selectedId}
          onClick={deleteSelected}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: 6,
            border: 'none',
            cursor: selectedId ? 'pointer' : 'not-allowed',
            background: '#bdbdbd',
            color: '#fff',
            opacity: selectedId ? 1 : 0.4,
          }}
        >
          🗑️ Delete
        </button>

        {/* Rename ボタン */}
        <button
          type="button"
          disabled={!selectedId}
          onClick={() => setShowRename(true)}
          style={{
    padding: '0.5rem 1rem',
    borderRadius: 6,
    border: 'none',
    cursor: selectedId ? 'pointer' : 'not-allowed',
    background: '#1982C4',
    color: '#fff',
    opacity: selectedId ? 1 : 0.4,
  }}
>
  ✏️ Rename
</button>

        {/* グリッド設定 */}
        <button
          type="button"
          onClick={() => setShowModal(true)}
          style={{
            cursor: 'pointer',
            border: 'none',
            background: '#6A4C93',
            color: '#fff',
            padding: '0.5rem 1rem',
            borderRadius: 6,
          }}
        >
          ⚙️ Grid
        </button>
      </header>

      {/* ───────────── キャンバス ───────────── */}
      <main
        style={{
          flex: 1,
          overflow: 'auto',
          background: '#fafafa',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '1rem',
        }}
      >
        <CanvasGrid
          rows={stage.rows}
          cols={stage.cols}
          cellRatio={stage.cellRatio}
          dancers={dancers}
          mode={mode}
          selectedId={selectedId}
          onPlace={addDancer}
          onSelect={setSelectedId}
          onMove={moveDancer}
        />
      </main>

      {/* ────────── グリッド設定モーダル ───────── */}
      {showModal && (
        <GridSettingsModal
          initial={stage}
          onSave={(cfg) => {
            setStage(cfg);
            setShowModal(false);
          }}
          onClose={() => setShowModal(false)}
        />
      )}

      {/* Name‑edit モーダル */}
{showRename && selectedId && (
  <NameEditModal
    initial={dancers.find((d) => d.id === selectedId)?.name ?? ''}
    onSave={(newName) => {
      setDancers((prev) =>
        prev.map((d) => (d.id === selectedId ? { ...d, name: newName } : d)),
      );
      setShowRename(false);
    }}
    onClose={() => setShowRename(false)}
  />
)}
    </div>
  );
}
