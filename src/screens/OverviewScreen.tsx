import React, { useState } from 'react';
import { Expense, Category, CATEGORY_COLORS } from '../types';
import { formatEuro } from '../utils';

interface Props {
  expenses: Expense[];
}

interface MonthGroup {
  key: string;
  label: string;
  total: number;
  byCategory: { name: string; amount: number; color: string }[];
}

function groupByMonth(expenses: Expense[]): MonthGroup[] {
  const map = new Map<string, Expense[]>();
  for (const e of expenses) {
    const d = new Date(e.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(e);
  }

  const months: MonthGroup[] = [];
  for (const [key, items] of map.entries()) {
    const [year, month] = key.split('-');
    const label = new Date(Number(year), Number(month) - 1, 1).toLocaleDateString(undefined, {
      month: 'long',
      year: 'numeric',
    });
    const total = items.reduce((s, e) => s + e.amount, 0);
    const catMap = new Map<string, number>();
    for (const e of items) {
      catMap.set(e.category, (catMap.get(e.category) || 0) + e.amount);
    }
    const byCategory = Array.from(catMap.entries())
      .map(([name, amount]) => ({ name, amount, color: CATEGORY_COLORS[name as Category] }))
      .sort((a, b) => b.amount - a.amount);
    months.push({ key, label, total, byCategory });
  }

  return months.sort((a, b) => b.key.localeCompare(a.key));
}

export default function OverviewScreen({ expenses }: Props) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const months = groupByMonth(expenses);

  const toggle = (key: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  if (months.length === 0) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', paddingTop: 80 }}>
        <span style={{ color: '#999', fontSize: 16 }}>No expenses yet</span>
      </div>
    );
  }

  return (
    <div style={{ padding: 16, paddingBottom: 24 }}>
      {months.map((m) => {
        const isOpen = expanded.has(m.key);
        return (
          <div
            key={m.key}
            style={{
              background: '#fff',
              borderRadius: 12,
              marginBottom: 12,
              boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
              overflow: 'hidden',
            }}
          >
            <button
              onClick={() => toggle(m.key)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                padding: '14px 16px',
                background: 'none',
              }}
            >
              <span style={{ flex: 1, fontSize: 15, fontWeight: 600, color: '#222', textAlign: 'left' }}>
                {m.label}
              </span>
              <span style={{ fontSize: 15, fontWeight: 700, color: '#4A90E2', marginRight: 10 }}>
                {formatEuro(m.total)}
              </span>
              <span style={{ fontSize: 16, color: '#aaa', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                ▾
              </span>
            </button>

            {isOpen && (
              <div style={{ padding: '0 16px 14px' }}>
                <div style={{ height: 1, background: '#f0f0f0', marginBottom: 12 }} />
                {m.byCategory.map((cat) => (
                  <div
                    key={cat.name}
                    style={{ display: 'flex', alignItems: 'center', paddingTop: 7, paddingBottom: 7 }}
                  >
                    <div
                      style={{
                        width: 10, height: 10, borderRadius: '50%',
                        background: cat.color, marginRight: 10, flexShrink: 0,
                      }}
                    />
                    <span style={{ flex: 1, fontSize: 13, color: '#555' }}>{cat.name}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#333' }}>
                      {formatEuro(cat.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
