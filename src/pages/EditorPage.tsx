import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import GridSettingsModal, { type StageConfig } from '../components/GridSettingsModal';
import NameEditModal from '../components/NameEditModal';
import TimelineBar from '../components/TimelineBar';
import CanvasGrid, { type Dancer, type Mode } from '../components/CanvasGrid';

const DEFAULT_STAGE: StageConfig = { rows: 10, cols: 15, cellRatio: 1 };
const COLORS = ['#FF595E', '#1982C4', '#6A4C93', '#8AC926', '#FFCA3A'];
const ANIM_MS = 100;

/* ---------- 型定義 ---------- */
interface Formation {
  id: string;
  name: string;
  dancers: Dancer[];
}
/* shallow clone */
const clone = <T,>(a: T[]): T[] => a.map((x) => ({ ...x }));

export default function EditorPage() {
  /* -------- 初期ステージ -------- */
  const location = useLocation() as { state?: { project?: { stage: StageConfig } } };
  const [stage, setStage] = useState<StageConfig>(location.state?.project?.stage ?? DEFAULT_STAGE);

  /* -------- フォーメーション & タイムライン -------- */
  const [formations, setFormations] = useState<Formation[]>([
    { id: 'F1', name: 'Scene 1', dancers: [] },
  ]);
  const [currentIdx, setCurrentIdx] = useState(0);

  /* -------- 編集ステート -------- */
  const [mode, setMode] = useState<Mode>('place');
  const [color, setColor] = useState(COLORS[0]);
  const [nextDid, setNextDid] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  /* -------- UI モーダル -------- */
  const [showGrid, setShowGrid] = useState(false);
  const [showRename, setShowRename] = useState(false);

  /* -------- アニメーション -------- */
  const [playing, setPlaying] = useState(false);
  const [display, setDisplay] = useState<Dancer[]>([]); // キャンバス描画用
  const rafRef = useRef<number | undefined>(undefined);
  const startRef = useRef<number | undefined>(undefined);
  const srcRef = useRef<Dancer[]>([]);
  const dstRef = useRef<Dancer[]>([]);

  /* 現シーンの dancers */
  const dancers = formations[currentIdx].dancers;

  /* ---------- フォーメーション編集ユーティリティ ---------- */
  const updateCurrent = (fn: (d: Dancer[]) => Dancer[]) =>
    setFormations((prev) =>
      prev.map((f, i) => (i === currentIdx ? { ...f, dancers: fn(f.dancers) } : f)),
    );

  const addDancer = (row: number, col: number) => {
    if (playing || dancers.some((d) => d.row === row && d.col === col)) return;
    const id = `D${nextDid}`;
    setNextDid((n) => n + 1);
    updateCurrent((d) => [...d, { id, name: id, color, row, col }]);
  };

  const moveDancer = (id: string, row: number, col: number) =>
    !playing && updateCurrent((d) => d.map((x) => (x.id === id ? { ...x, row, col } : x)));

  const deleteSel = () => {
    if (!selectedId || playing) return;
    updateCurrent((d) => d.filter((x) => x.id !== selectedId));
    setSelectedId(null);
  };

  const renameSel = (nm: string) =>
    updateCurrent((d) => d.map((x) => (x.id === selectedId ? { ...x, name: nm } : x)));

  /* ---------- Delete/Backspace ショートカット ---------- */
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (
        selectedId &&
        !playing &&
        (e.key === 'Delete' || e.key === 'Backspace') &&
        (e.target as HTMLElement).tagName !== 'INPUT'
      ) {
        e.preventDefault();
        deleteSel();
      }
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [selectedId, playing]);

  /* ---------- シーン追加 ---------- */
  const addFormation = () => {
    if (playing) return;
    const idx = formations.length;
    setFormations([...formations, { id: `F${idx + 1}`, name: `Scene ${idx + 1}`, dancers: clone(dancers) }]);
    setCurrentIdx(idx);
    setSelectedId(null);
  };

  /* ---------- 遷移アニメーション ---------- */
  const goToScene = (targetIdx: number) => {
    if (playing || targetIdx === currentIdx) return;

    // 0) 準備
    const from = formations[currentIdx].dancers;
    const to = formations[targetIdx].dancers;

    const ids = Array.from(new Set([...from, ...to].map((d) => d.id)));
    srcRef.current = ids.map((id) => {
      const src = from.find((d) => d.id === id);
      const dst = to.find((d) => d.id === id);
      return {
        id,
        name: src?.name ?? dst?.name ?? id,
        color: src?.color ?? dst?.color ?? COLORS[0],
        row: src?.row ?? dst?.row ?? 0,
        col: src?.col ?? dst?.col ?? 0,
      };
    });
    dstRef.current = ids.map((id) => to.find((d) => d.id === id) ?? srcRef.current.find((x) => x.id === id)!);

    setPlaying(true);
    setDisplay(srcRef.current);
    setSelectedId(null);

    const frame = (t: number) => {
      if (!startRef.current) startRef.current = t;
      const prog = Math.min((t - startRef.current) / ANIM_MS, 1);

      setDisplay(
        srcRef.current.map((s, i) => ({
          ...s,
          row: s.row + (dstRef.current[i].row - s.row) * prog,
          col: s.col + (dstRef.current[i].col - s.col) * prog,
        })),
      );

      if (prog < 1) {
        rafRef.current = requestAnimationFrame(frame);
      } else {
        cancelAnimationFrame(rafRef.current!);
        startRef.current = undefined;
        setPlaying(false);
        setCurrentIdx(targetIdx);
      }
    };
    rafRef.current = requestAnimationFrame(frame);
  };

  /* アンマウント時に raf 解除 */
  useEffect(() => () => cancelAnimationFrame(rafRef.current!), []);

  /* ---------- JSX ---------- */
  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* ツールバー */}
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
        {/* Place / Move 切替 */}
        <button
          onClick={() => !playing && setMode(mode === 'place' ? 'move' : 'place')}
          style={{
            border: 'none',
            padding: '0.5rem 1rem',
            borderRadius: 6,
            cursor: playing ? 'not-allowed' : 'pointer',
            background: mode === 'place' ? '#1982C4' : '#FF595E',
            color: '#fff',
            opacity: playing ? 0.35 : 1,
          }}
        >
          {mode === 'place' ? '🖊️ Place' : '🖐️ Move'}
        </button>

        {/* カラーパレット */}
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {COLORS.map((c) => (
            <button
              key={c}
              disabled={mode !== 'place' || playing}
              onClick={() => setColor(c)}
              style={{
                width: 24,
                height: 24,
                borderRadius: '50%',
                border: color === c ? '3px solid #000' : '1px solid #999',
                background: c,
                cursor: mode === 'place' && !playing ? 'pointer' : 'not-allowed',
                opacity: mode === 'place' && !playing ? 1 : 0.35,
              }}
            />
          ))}
        </div>

        {/* Delete / Rename */}
        <button
          disabled={!selectedId || playing}
          onClick={deleteSel}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: 6,
            border: 'none',
            cursor: !selectedId || playing ? 'not-allowed' : 'pointer',
            background: '#bdbdbd',
            color: '#fff',
            opacity: !selectedId || playing ? 0.35 : 1,
          }}
        >
          🗑️ Delete
        </button>

        <button
          disabled={!selectedId || playing}
          onClick={() => setShowRename(true)}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: 6,
            border: 'none',
            cursor: !selectedId || playing ? 'not-allowed' : 'pointer',
            background: '#1982C4',
            color: '#fff',
            opacity: !selectedId || playing ? 0.35 : 1,
          }}
        >
          ✏️ Rename
        </button>

        {/* Grid */}
        <button
          disabled={playing}
          onClick={() => setShowGrid(true)}
          style={{
            border: 'none',
            padding: '0.5rem 1rem',
            borderRadius: 6,
            cursor: playing ? 'not-allowed' : 'pointer',
            background: '#6A4C93',
            color: '#fff',
            opacity: playing ? 0.35 : 1,
          }}
        >
          ⚙️ Grid
        </button>
      </header>

      {/* キャンバス */}
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
          dancers={playing ? display : dancers}
          mode={mode}
          selectedId={selectedId}
          onPlace={addDancer}
          onSelect={setSelectedId}
          onMove={moveDancer}
        />
      </main>

      {/* タイムライン */}
      <TimelineBar
        formations={formations.map((f) => ({ id: f.id, name: f.name }))}
        current={currentIdx}
        onSelect={(idx) => goToScene(idx)}
        onAdd={addFormation}
      />

      {/* モーダル */}
      {showGrid && (
        <GridSettingsModal
          initial={stage}
          onSave={(cfg) => {
            setStage(cfg);
            setShowGrid(false);
          }}
          onClose={() => setShowGrid(false)}
        />
      )}

      {showRename && selectedId && (
        <NameEditModal
          initial={dancers.find((d) => d.id === selectedId)?.name ?? ''}
          onSave={(n) => {
            renameSel(n);
            setShowRename(false);
          }}
          onClose={() => setShowRename(false)}
        />
      )}
    </div>
  );
}
