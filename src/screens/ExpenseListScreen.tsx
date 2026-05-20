import React from 'react';
import { Expense, CATEGORY_COLORS } from '../types';
import { formatEuro } from '../utils';

interface Props {
  expenses: Expense[];
  onDelete: (id: string) => void;
}

export default function ExpenseListScreen({ expenses, onDelete }: Props) {
  const handleDelete = (id: string) => {
    if (window.confirm('Delete this expense?')) {
      onDelete(id);
    }
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(undefined, {
      month: 'short', day: 'numeric', year: 'numeric',
    });

  if (expenses.length === 0) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', paddingTop: 80 }}>
        <span style={{ color: '#999', fontSize: 16 }}>No expenses yet</span>
      </div>
    );
  }

  return (
    <div style={{ padding: 16, paddingBottom: 24 }}>
      {expenses.map((item) => (
        <div
          key={item.id}
          style={{
            display: 'flex',
            alignItems: 'center',
            background: '#fff',
            borderRadius: 10,
            padding: 14,
            marginBottom: 10,
            boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
          }}
        >
          <div
            style={{
              width: 10, height: 10, borderRadius: '50%',
              background: CATEGORY_COLORS[item.category], marginRight: 12, flexShrink: 0,
            }}
          />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#333' }}>
              {item.description || item.category}
            </div>
            <div style={{ fontSize: 12, color: '#999', marginTop: 2 }}>
              {item.category} · {formatDate(item.date)}
            </div>
          </div>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#333', marginRight: 12 }}>
            {formatEuro(item.amount)}
          </span>
          <button
            onClick={() => handleDelete(item.id)}
            style={{ color: '#ccc', fontSize: 16, padding: 4 }}
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
