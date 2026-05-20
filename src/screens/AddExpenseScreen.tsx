import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Expense, CATEGORIES, CATEGORY_COLORS, Category } from '../types';

interface Props {
  onSave: (expense: Expense) => void;
  onCancel: () => void;
}

export default function AddExpenseScreen({ onSave }: Props) {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Category>('Food');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [error, setError] = useState('');

  const handleSave = () => {
    const parsed = parseFloat(amount.replace(',', '.'));
    if (isNaN(parsed) || parsed <= 0) {
      setError('Please enter a valid positive amount.');
      return;
    }
    setError('');
    onSave({
      id: uuidv4(),
      amount: parsed,
      category,
      description: description.trim(),
      date: new Date(date + 'T12:00:00').toISOString(),
    });
  };

  return (
    <div style={{ padding: 16, paddingBottom: 32 }}>
      <div style={fieldGroup}>
        <label style={labelStyle}>Amount (€)</label>
        <input
          type="number"
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0,00"
          style={inputStyle}
        />
        {error ? <span style={{ color: '#e55', fontSize: 13, marginTop: 4 }}>{error}</span> : null}
      </div>

      <div style={fieldGroup}>
        <label style={labelStyle}>Description (optional)</label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g. Grocery run"
          style={inputStyle}
        />
      </div>

      <div style={fieldGroup}>
        <label style={labelStyle}>Date</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          style={inputStyle}
        />
      </div>

      <div style={fieldGroup}>
        <label style={labelStyle}>Category</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
          {CATEGORIES.map((cat) => {
            const selected = category === cat;
            return (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                style={{
                  padding: '8px 14px',
                  borderRadius: 20,
                  border: `1.5px solid ${selected ? CATEGORY_COLORS[cat] : '#ddd'}`,
                  background: selected ? CATEGORY_COLORS[cat] : '#fff',
                  color: selected ? '#fff' : '#555',
                  fontSize: 13,
                  fontWeight: selected ? 700 : 500,
                }}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      <button
        onClick={handleSave}
        style={{
          width: '100%', background: '#4A90E2', color: '#fff', borderRadius: 12,
          padding: 16, fontSize: 16, fontWeight: 600, marginTop: 24,
        }}
      >
        Save Expense
      </button>
    </div>
  );
}

const fieldGroup: React.CSSProperties = {
  marginBottom: 20,
  display: 'flex',
  flexDirection: 'column',
};

const labelStyle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 600,
  color: '#555',
  marginBottom: 6,
};

const inputStyle: React.CSSProperties = {
  background: '#fff',
  borderRadius: 10,
  padding: 14,
  fontSize: 16,
  color: '#333',
  border: '1px solid #e0e0e0',
  width: '100%',
  outline: 'none',
};
