export type Category =
  | 'Food'
  | 'Transport'
  | 'Housing'
  | 'Entertainment'
  | 'Health'
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
  'Transport',
  'Housing',
  'Entertainment',
  'Health',
  'Shopping',
  'Fixed costs',
  'Other',
];

export const CATEGORY_COLORS: Record<Category, string> = {
  Food: '#FF6B6B',
  Transport: '#4ECDC4',
  Housing: '#45B7D1',
  Entertainment: '#96CEB4',
  Health: '#FFEAA7',
  Shopping: '#DDA0DD',
  'Fixed costs': '#F0A500',
  Other: '#98D8C8',
};
