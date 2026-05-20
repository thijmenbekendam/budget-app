import React, { useState } from 'react';
import PieChart from '../components/PieChart';
import { Expense, Category, CATEGORY_COLORS } from '../types';
import { formatEuro, getPeriodStart } from '../utils';

type Period = 'week' | 'month';

interface Props {
  expenses: Expense[];
  onAdd: () => void;
}

export default function HomeScreen({ expenses, onAdd }: Props) {
  const [period, setPeriod] = useState<Period>('month');

  const periodStart = getPeriodStart(period);
  const filtered = expenses.filter((e) => new Date(e.date) >= periodStart);
  const total = filtered.reduce((sum, e) => sum + e.amount, 0);

  const byCategory = filtered.reduce<Record<string, number>>((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount;
    return acc;
  }, {});

  const chartData = Object.entries(byCategory).map(([name, amount]) => ({
    name,
    amount,
    color: CATEGORY_COLORS[name as Category],
  }));

  const recent = filtered.slice(0, 5);

  return (
    <div style={{ padding: 16, paddingBottom: 24 }}>
      {/* Total card */}
      <div style={card('#4A90E2', 24)}>
        {/* Toggle */}
        <div style={{
          display: 'flex',
          background: 'rgba(0,0,0,0.15)',
          borderRadius: 20,
          padding: 3,
          marginBottom: 16,
          alignSelf: 'center',
        }}>
          {(['week', 'month'] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              style={{
                padding: '6px 20px',
                borderRadius: 18,
                fontSize: 13,
                fontWeight: 600,
                background: period === p ? '#fff' : 'transparent',
                color: period === p ? '#4A90E2' : 'rgba(255,255,255,0.75)',
              }}
            >
              {p === 'week' ? 'Week' : 'Month'}
            </button>
          ))}
        </div>
        <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14 }}>
          {period === 'week' ? 'This Week' : 'This Month'}
        </span>
        <span style={{ color: '#fff', fontSize: 36, fontWeight: 700, marginTop: 4 }}>
          {formatEuro(total)}
        </span>
      </div>

      {/* Chart */}
      {chartData.length > 0 ? (
        <div style={card('#fff', 16)}>
          <span style={sectionTitle}>Spending by Category</span>
          <PieChart data={chartData} />
        </div>
      ) : (
        <div style={{ ...card('#fff', 32), alignItems: 'center' }}>
          <span style={{ color: '#999', fontSize: 14 }}>No expenses this {period}</span>
          <span style={{ color: '#bbb', fontSize: 12, marginTop: 4 }}>
            Add your first expense to see a chart
          </span>
        </div>
      )}

      {/* Recent */}
      <div style={card('#fff', 16)}>
        <span style={sectionTitle}>Recent Expenses</span>
        {recent.length === 0 ? (
          <span style={{ color: '#999', fontSize: 14 }}>Nothing here yet</span>
        ) : (
          recent.map((e) => (
            <div key={e.id} style={{
              display: 'flex',
              alignItems: 'center',
              paddingTop: 10,
              paddingBottom: 10,
              borderBottom: '1px solid #f0f0f0',
            }}>
              <div style={{
                width: 10, height: 10, borderRadius: '50%',
                background: CATEGORY_COLORS[e.category], marginRight: 12, flexShrink: 0,
              }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, color: '#333', fontWeight: 500 }}>
                  {e.description || e.category}
                </div>
                <div style={{ fontSize: 12, color: '#999', marginTop: 2 }}>{e.category}</div>
              </div>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#333' }}>
                {formatEuro(e.amount)}
              </span>
            </div>
          ))
        )}
      </div>

      <button
        onClick={onAdd}
        style={{
          width: '100%', background: '#4A90E2', color: '#fff', borderRadius: 12,
          padding: 16, fontSize: 16, fontWeight: 600, marginTop: 8,
        }}
      >
        + Add Expense
      </button>
    </div>
  );
}

function card(bg: string, padding: number): React.CSSProperties {
  return {
    background: bg,
    borderRadius: 12,
    padding,
    marginBottom: 16,
    display: 'flex',
    flexDirection: 'column',
  };
}

const sectionTitle: React.CSSProperties = {
  fontSize: 16,
  fontWeight: 600,
  marginBottom: 12,
  color: '#222',
};
