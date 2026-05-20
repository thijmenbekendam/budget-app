export interface CryptoHolding {
  id: string;
  name: string;
  amountUsd: number;
}

export interface Schuld {
  id: string;
  name: string;
  amountEur: number;
}

export interface VermogenSnapshot {
  monthKey: string;
  label: string;
  spaargeld: number;
  cryptoEur: number;
  schulden: number;
  netWorth: number;
}

export interface VermogenData {
  spaargeld: number;
  cryptoHoldings: CryptoHolding[];
  schulden: Schuld[];
  history: VermogenSnapshot[];
}

export type Category =
  | 'Food'
  | 'Groceries'
  | 'Transport'
  | 'Gas'
  | 'Housing'
  | 'Entertainment'
  | 'Going out'
  | 'Drinks'
  | 'Holiday'
  | 'Shopping'
  | 'Fixed costs'
  | 'Other';

export interface Expense {
  id: string;
  amount: number;
  category: Category;
  description: string;
  date: string; // ISO string
}

export const CATEGORIES: Category[] = [
  'Food',
  'Groceries',
  'Transport',
  'Gas',
  'Housing',
  'Entertainment',
  'Going out',
  'Drinks',
  'Holiday',
  'Shopping',
  'Fixed costs',
  'Other',
];

export const CATEGORY_COLORS: Record<Category, string> = {
  Food: '#FF6B6B',
  Groceries: '#FF9F43',
  Transport: '#4ECDC4',
  Gas: '#E17055',
  Housing: '#45B7D1',
  Entertainment: '#96CEB4',
  'Going out': '#A29BFE',
  Drinks: '#FD79A8',
  Holiday: '#FDCB6E',
  Shopping: '#DDA0DD',
  'Fixed costs': '#F0A500',
  Other: '#98D8C8',
};
