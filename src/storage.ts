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
    if (!raw) return VERMOGEN_DEFAULT;
    const data = JSON.parse(raw) as VermogenData;
    // Drop holdings from the old format (had amountUsd, no symbol/amount/coinId)
    data.cryptoHoldings = (data.cryptoHoldings ?? []).filter(
      (h) => h.symbol != null && h.amount != null && h.coinId != null
    );
    // Ensure every snapshot has an id (old snapshots pre-dated the id field)
    data.history = (data.history ?? []).map((s) =>
      s.id ? s : { ...s, id: crypto.randomUUID() }
    );
    data.schulden = data.schulden ?? [];
    return data;
  } catch {
    return VERMOGEN_DEFAULT;
  }
}

export function saveVermogen(data: VermogenData): void {
  localStorage.setItem(VERMOGEN_KEY, JSON.stringify(data));
}
