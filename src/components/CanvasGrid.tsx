import React, { useEffect, useRef, useState } from 'react';

export interface Dancer {
  id: string;
  name: string;
  color: string;
  row: number;
  col: number;
}

export type Mode = 'place' | 'move';

export interface GridProps {
  rows: number;
  cols: number;
  cellRatio: number;
  dancers: Dancer[];

  /* モード切替・選択状態 */
  mode: Mode;
  selectedId: string | null;

  /* コールバック */
  onPlace: (row: number, col: number) => void;
  onSelect: (id: string | null) => void;
  onMove: (id: string, row: number, col: number) => void;
}

/** 横幅固定：1 セル 40px */
const CELL_W = 40;

const CanvasGrid: React.FC<GridProps> = ({
  rows,
  cols,
  cellRatio,
  dancers,
  mode,
  selectedId,
  onPlace,
  onSelect,
  onMove,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const CELL_H = CELL_W / cellRatio;
  const width = cols * CELL_W;
  const height = rows * CELL_H;

  /* === 描画 ============================================================= */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);

    /* 背景 & グリッド線 */
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;
    for (let c = 0; c <= cols; c += 1) {
      const x = c * CELL_W + 0.5;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let r = 0; r <= rows; r += 1) {
      const y = r * CELL_H + 0.5;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    /* ダンサーアイコン */
    const radius = Math.min(CELL_W, CELL_H) * 0.35;
    ctx.font = `${radius * 0.9}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    dancers.forEach((d) => {
      const cx = d.col * CELL_W + CELL_W / 2;
      const cy = d.row * CELL_H + CELL_H / 2;

      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fillStyle = d.color;
      ctx.fill();

      /* 枠線（選択時は太線） */
      ctx.lineWidth = d.id === selectedId ? 3 : 1;
      ctx.strokeStyle = d.id === selectedId ? '#000' : '#333';
      ctx.stroke();

      ctx.fillStyle = '#fff';
      ctx.fillText(d.name.slice(0, 2), cx, cy);
    });
  }, [rows, cols, cellRatio, dancers, width, height, selectedId]);

  /* === 座標計算ユーティリティ ========================================= */
  const xyToCell = (x: number, y: number) => ({
    col: Math.floor(x / CELL_W),
    row: Math.floor(y / CELL_H),
  });

  const dancerAt = (row: number, col: number) =>
    dancers.find((d) => d.row === row && d.col === col);

  /* === マウスイベント ================================================== */
  const onMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const { row, col } = xyToCell(e.clientX - rect.left, e.clientY - rect.top);

    if (mode === 'place') {
      /* 配置モード：空セルなら配置 */
      if (!dancerAt(row, col)) onPlace(row, col);
      return;
    }

    /* move モード：ダンサーがいれば選択 & ドラッグ開始 */
    const target = dancerAt(row, col);
    if (target) {
      onSelect(target.id);
      setDraggingId(target.id);
      e.preventDefault();
    } else {
      onSelect(null); // 空セルクリックで選択解除
    }
  };

  const onMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!draggingId) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const { row, col } = xyToCell(e.clientX - rect.left, e.clientY - rect.top);

    if (
      row >= 0 &&
      row < rows &&
      col >= 0 &&
      col < cols &&
      !dancerAt(row, col)
    ) {
      onMove(draggingId, row, col);
    }
  };

  const stopDrag = () => setDraggingId(null);

  return (
    <canvas
      ref={canvasRef}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={stopDrag}
      onMouseLeave={stopDrag}
      style={{
        border: '1px solid #bdbdbd',
        background: '#fff',
        display: 'block',
        margin: 'auto',
        cursor: mode === 'place' ? 'crosshair' : 'pointer',
      }}
    />
  );
};

export default CanvasGrid;
