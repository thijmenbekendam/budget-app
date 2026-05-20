export type Category =
  | 'Food'
  | 'Groceries'
  | 'Transport'
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
  Housing: '#45B7D1',
  Entertainment: '#96CEB4',
  'Going out': '#A29BFE',
  Drinks: '#FD79A8',
  Holiday: '#FDCB6E',
  Shopping: '#DDA0DD',
  'Fixed costs': '#F0A500',
  Other: '#98D8C8',
};
