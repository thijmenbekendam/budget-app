import { Expense, VermogenData } from './types';

const KEY = 'expenses';

export function loadExpenses(): Expense[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Expense[]) : [];
  } catch {
    return [];
  }
}

export function saveExpenses(expenses: Expense[]): void {
  localStorage.setItem(KEY, JSON.stringify(expenses));
}

const VERMOGEN_KEY = 'vermogen';
const VERMOGEN_DEFAULT: VermogenData = { spaargeld: 0, cryptoHoldings: [], schulden: [], history: [] };

export function loadVermogen(): VermogenData {
  try {
    const raw = localStorage.getItem(VERMOGEN_KEY);
    return raw ? (JSON.parse(raw) as VermogenData) : VERMOGEN_DEFAULT;
  } catch {
    return VERMOGEN_DEFAULT;
  }
}

export function saveVermogen(data: VermogenData): void {
  localStorage.setItem(VERMOGEN_KEY, JSON.stringify(data));
}
