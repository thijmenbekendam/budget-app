import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';

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
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 8;

  if (total === 0) return null;

  let cursor = 0;
  const slices = data.map((d) => {
    const angle = (d.amount / total) * 360;
    const path = slicePath(cx, cy, r, cursor, cursor + angle);
    cursor += angle;
    return { ...d, path };
  });

  return (
    <View>
      <Svg width={size} height={size} style={styles.svg}>
        {slices.map((s) => (
          <Path key={s.name} d={s.path} fill={s.color} />
        ))}
        <Circle cx={cx} cy={cy} r={r * 0.45} fill="#fff" />
      </Svg>
      <View style={styles.legend}>
        {slices.map((s) => (
          <View key={s.name} style={styles.legendRow}>
            <View style={[styles.dot, { backgroundColor: s.color }]} />
            <Text style={styles.legendLabel}>{s.name}</Text>
            <Text style={styles.legendValue}>${s.amount.toFixed(2)}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  svg: { alignSelf: 'center' },
  legend: { marginTop: 12 },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  legendLabel: { flex: 1, fontSize: 13, color: '#444' },
  legendValue: { fontSize: 13, fontWeight: '600', color: '#333' },
});
