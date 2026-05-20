import React from 'react';
import { formatEuro } from '../utils';

interface Point {
  savedAt: string;
  netWorth: number;
}

interface Props {
  snapshots: Point[];
}

const W = 300;
const H = 170;
const PAD = { top: 16, right: 12, bottom: 36, left: 58 };
const CW = W - PAD.left - PAD.right;
const CH = H - PAD.top - PAD.bottom;

function yTicks(yMin: number, yMax: number): number[] {
  const range = yMax - yMin || 1;
  const step = range / 4;
  return Array.from({ length: 5 }, (_, i) => yMin + i * step);
}

function visibleIndices(count: number): Set<number> {
  const max = 6;
  if (count <= max) return new Set(Array.from({ length: count }, (_, i) => i));
  const set = new Set<number>([0, count - 1]);
  const step = (count - 1) / (max - 1);
  for (let i = 1; i < max - 1; i++) set.add(Math.round(i * step));
  return set;
}

function fmtK(v: number): string {
  const abs = Math.abs(v);
  if (abs >= 1_000_000) return `€${(v / 1_000_000).toFixed(1)}M`;
  if (abs >= 1000) return `€${(v / 1000).toFixed(0)}k`;
  return `€${v.toFixed(0)}`;
}

function fmtDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' });
}

export default function NetWorthChart({ snapshots }: Props) {
  if (snapshots.length < 2) {
    return (
      <div style={{ textAlign: 'center', color: '#bbb', fontSize: 13, padding: '20px 0' }}>
        Sla minimaal 2 snapshots op om de grafiek te zien.
      </div>
    );
  }

  const sorted = [...snapshots].sort((a, b) => a.savedAt.localeCompare(b.savedAt));
  const values = sorted.map((s) => s.netWorth);
  const rawMin = Math.min(...values);
  const rawMax = Math.max(...values);
  const range = rawMax - rawMin || 1;
  const pad = range * 0.12;
  const yMin = rawMin - pad;
  const yMax = rawMax + pad;

  const toX = (i: number) =>
    PAD.left + (sorted.length === 1 ? CW / 2 : (i / (sorted.length - 1)) * CW);
  const toY = (v: number) => PAD.top + CH - ((v - yMin) / (yMax - yMin)) * CH;

  const pts = sorted.map((s, i) => ({ x: toX(i), y: toY(s.netWorth), ...s }));
  const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  const areaPath = `${linePath} L${pts[pts.length - 1].x},${PAD.top + CH} L${pts[0].x},${PAD.top + CH}Z`;

  const ticks = yTicks(yMin, yMax);
  const showIdx = visibleIndices(sorted.length);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      style={{ width: '100%', height: 'auto', display: 'block' }}
    >
      {/* Y grid + labels */}
      {ticks.map((v, i) => (
        <g key={i}>
          <line
            x1={PAD.left} y1={toY(v)} x2={W - PAD.right} y2={toY(v)}
            stroke="#f0f0f0" strokeWidth={1}
          />
          <text
            x={PAD.left - 5} y={toY(v)}
            textAnchor="end" dominantBaseline="middle"
            fontSize={7.5} fill="#bbb"
          >
            {fmtK(v)}
          </text>
        </g>
      ))}

      {/* Zero line if visible */}
      {yMin < 0 && yMax > 0 && (
        <line
          x1={PAD.left} y1={toY(0)} x2={W - PAD.right} y2={toY(0)}
          stroke="#e0e0e0" strokeWidth={1} strokeDasharray="3,3"
        />
      )}

      {/* Area fill */}
      <path d={areaPath} fill="rgba(74,144,226,0.08)" />

      {/* Line */}
      <path
        d={linePath}
        fill="none" stroke="#4A90E2" strokeWidth={2}
        strokeLinejoin="round" strokeLinecap="round"
      />

      {/* Dots + tooltip-style value on hover (static label on last point) */}
      {pts.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r={3} fill="#4A90E2" />
          {/* Show value label on the last (rightmost) point */}
          {i === pts.length - 1 && (
            <text
              x={p.x} y={p.y - 8}
              textAnchor="middle" fontSize={7.5} fontWeight="600" fill="#4A90E2"
            >
              {fmtK(p.netWorth)}
            </text>
          )}
        </g>
      ))}

      {/* X labels */}
      {pts.map((p, i) =>
        showIdx.has(i) ? (
          <text
            key={i}
            x={p.x} y={H - 4}
            textAnchor="middle" fontSize={7.5} fill="#bbb"
          >
            {fmtDate(p.savedAt)}
          </text>
        ) : null
      )}

      {/* Axis lines */}
      <line x1={PAD.left} y1={PAD.top} x2={PAD.left} y2={PAD.top + CH} stroke="#e8e8e8" strokeWidth={1} />
      <line x1={PAD.left} y1={PAD.top + CH} x2={W - PAD.right} y2={PAD.top + CH} stroke="#e8e8e8" strokeWidth={1} />
    </svg>
  );
}
