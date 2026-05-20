import React from 'react';
import { formatEuro } from '../utils';

interface Slice {
  name: string;
  amount: number;
  color: string;
}

interface Props {
  data: Slice[];
  size?: number;
}

function polarToCartesian(cx: number, cy: number, r: number, deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function slicePath(cx: number, cy: number, r: number, start: number, end: number) {
  const s = polarToCartesian(cx, cy, r, start);
  const e = polarToCartesian(cx, cy, r, end);
  const large = end - start > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y} Z`;
}

export default function PieChart({ data, size = 180 }: Props) {
  const total = data.reduce((s, d) => s + d.amount, 0);
  if (total === 0) return null;

  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 8;

  let cursor = 0;
  const slices = data.map((d) => {
    const angle = (d.amount / total) * 360;
    const path = slicePath(cx, cy, r, cursor, cursor + angle);
    cursor += angle;
    return { ...d, path };
  });

  return (
    <div>
      <svg
        width={size}
        height={size}
        style={{ display: 'block', margin: '0 auto' }}
        viewBox={`0 0 ${size} ${size}`}
      >
        {slices.map((s) => (
          <path key={s.name} d={s.path} fill={s.color} />
        ))}
        <circle cx={cx} cy={cy} r={r * 0.45} fill="white" />
      </svg>
      <div style={{ marginTop: 12 }}>
        {slices.map((s) => (
          <div
            key={s.name}
            style={{ display: 'flex', alignItems: 'center', paddingTop: 4, paddingBottom: 4 }}
          >
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: s.color,
                marginRight: 8,
                flexShrink: 0,
              }}
            />
            <span style={{ flex: 1, fontSize: 13, color: '#444' }}>{s.name}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#333' }}>
              {formatEuro(s.amount)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
