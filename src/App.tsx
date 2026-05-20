import React, { useState } from 'react';
import './App.css';
import HomeScreen from './screens/HomeScreen';
import AddExpenseScreen from './screens/AddExpenseScreen';
import ExpenseListScreen from './screens/ExpenseListScreen';
import OverviewScreen from './screens/OverviewScreen';
import { loadExpenses, saveExpenses } from './storage';
import { Expense } from './types';

type Screen = 'home' | 'expenses' | 'overview' | 'add';

export default function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [expenses, setExpenses] = useState<Expense[]>(() => loadExpenses());

  const handleSave = (expense: Expense) => {
    const updated = [expense, ...expenses];
    setExpenses(updated);
    saveExpenses(updated);
    setScreen('home');
  };

  const handleDelete = (id: string) => {
    const updated = expenses.filter((e) => e.id !== id);
    setExpenses(updated);
    saveExpenses(updated);
  };

  const isAdd = screen === 'add';

  return (
    <div className="app">
      <div className="app-header">
        {isAdd ? (
          <>
            <button className="app-header-back" onClick={() => setScreen('home')}>‹</button>
            <span className="app-header-title">Add Expense</span>
            <div className="app-header-spacer" />
          </>
        ) : (
          <>
            <div className="app-header-spacer" />
            <span className="app-header-title">
              {screen === 'home' ? 'Budget App' : screen === 'expenses' ? 'All Expenses' : 'Overview'}
            </span>
            <div className="app-header-spacer" />
          </>
        )}
      </div>

      <div className="app-content">
        {screen === 'home' && (
          <HomeScreen expenses={expenses} onAdd={() => setScreen('add')} />
        )}
        {screen === 'expenses' && (
          <ExpenseListScreen expenses={expenses} onDelete={handleDelete} />
        )}
        {screen === 'overview' && (
          <OverviewScreen expenses={expenses} />
        )}
        {screen === 'add' && (
          <AddExpenseScreen onSave={handleSave} onCancel={() => setScreen('home')} />
        )}
      </div>

      {!isAdd && (
        <nav className="app-nav">
          <button
            className={`nav-btn${screen === 'home' ? ' active' : ''}`}
            onClick={() => setScreen('home')}
          >
            <span className="nav-icon">📊</span>
            <span className="nav-label">Dashboard</span>
          </button>
          <button
            className={`nav-btn${screen === 'expenses' ? ' active' : ''}`}
            onClick={() => setScreen('expenses')}
          >
            <span className="nav-icon">📋</span>
            <span className="nav-label">Expenses</span>
          </button>
          <button
            className={`nav-btn${screen === 'overview' ? ' active' : ''}`}
            onClick={() => setScreen('overview')}
          >
            <span className="nav-icon">📅</span>
            <span className="nav-label">Overview</span>
          </button>
        </nav>
      )}
    </div>
  );
}
