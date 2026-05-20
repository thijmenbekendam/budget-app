import AsyncStorage from '@react-native-async-storage/async-storage';
import { Expense } from './types';

const EXPENSES_KEY = 'expenses';

export async function loadExpenses(): Promise<Expense[]> {
  const raw = await AsyncStorage.getItem(EXPENSES_KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function saveExpenses(expenses: Expense[]): Promise<void> {
  await AsyncStorage.setItem(EXPENSES_KEY, JSON.stringify(expenses));
}

export async function addExpense(expense: Expense): Promise<void> {
  const existing = await loadExpenses();
  await saveExpenses([expense, ...existing]);
}

export async function deleteExpense(id: string): Promise<Expense[]> {
  const existing = await loadExpenses();
  const updated = existing.filter((e) => e.id !== id);
  await saveExpenses(updated);
  return updated;
}
