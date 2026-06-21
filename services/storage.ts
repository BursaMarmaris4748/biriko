import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Transaction {
  id: string;
  type: 'gelir' | 'gider';
  amount: number;
  category: string;
  note: string;
  date: string;
  createdAt: string;
}

export type BirikimPeriyot = 'gunluk' | 'haftalik' | 'aylik';

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  period: BirikimPeriyot;
  startDate: string;
  targetDate?: string;
  createdAt: string;
}

export interface SavingsContribution {
  id: string;
  goalId: string;
  amount: number;
  date: string;
  note?: string;
  createdAt: string;
}

export interface FinanceData {
  transactions: Transaction[];
  savingsGoals: SavingsGoal[];
  savingsContributions: SavingsContribution[];
}

const STORAGE_KEY = '@biriko/finance_data';

const varsayilanData: FinanceData = {
  transactions: [],
  savingsGoals: [],
  savingsContributions: [],
};

export async function loadData(): Promise<FinanceData> {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEY);
    if (json) return JSON.parse(json) as FinanceData;
    return varsayilanData;
  } catch {
    return varsayilanData;
  }
}

export async function saveData(data: FinanceData): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export async function addTransaction(
  transaction: Omit<Transaction, 'id' | 'createdAt'>
): Promise<FinanceData> {
  const data = await loadData();
  const yeni: Transaction = {
    ...transaction,
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    createdAt: new Date().toISOString(),
  };
  data.transactions.unshift(yeni);
  await saveData(data);
  return data;
}

export async function deleteTransaction(id: string): Promise<FinanceData> {
  const data = await loadData();
  data.transactions = data.transactions.filter((t) => t.id !== id);
  await saveData(data);
  return data;
}

export async function setSavingsGoal(goal: {
  name: string;
  targetAmount: number;
  period: BirikimPeriyot;
  targetDate?: string;
}): Promise<FinanceData> {
  const data = await loadData();
  const yeni: SavingsGoal = {
    ...goal,
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    currentAmount: 0,
    startDate: new Date().toISOString().split('T')[0],
    createdAt: new Date().toISOString(),
  };
  data.savingsGoals.push(yeni);
  await saveData(data);
  return data;
}

export async function updateSavingsGoal(
  goalId: string,
  updates: Partial<Omit<SavingsGoal, 'id' | 'createdAt'>>
): Promise<FinanceData> {
  const data = await loadData();
  const idx = data.savingsGoals.findIndex((g) => g.id === goalId);
  if (idx === -1) return data;
  data.savingsGoals[idx] = { ...data.savingsGoals[idx], ...updates };
  await saveData(data);
  return data;
}

export async function addSavingsContribution(contribution: {
  goalId: string;
  amount: number;
  note?: string;
}): Promise<FinanceData> {
  const data = await loadData();
  const goal = data.savingsGoals.find((g) => g.id === contribution.goalId);
  if (!goal) return data;

  const yeni: SavingsContribution = {
    ...contribution,
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    date: new Date().toISOString().split('T')[0],
    createdAt: new Date().toISOString(),
  };
  data.savingsContributions.push(yeni);
  goal.currentAmount += contribution.amount;

  if (goal.currentAmount >= goal.targetAmount) {
    goal.currentAmount = goal.targetAmount;
  }

  await saveData(data);
  return data;
}

export async function deleteSavingsGoal(goalId: string): Promise<FinanceData> {
  const data = await loadData();
  data.savingsGoals = data.savingsGoals.filter((g) => g.id !== goalId);
  data.savingsContributions = data.savingsContributions.filter((c) => c.goalId !== goalId);
  await saveData(data);
  return data;
}

export async function getSavingsContributions(goalId: string): Promise<SavingsContribution[]> {
  const data = await loadData();
  return data.savingsContributions.filter((c) => c.goalId === goalId);
}

export function hesaplaGelir(transactions: Transaction[]): number {
  return transactions
    .filter((t) => t.type === 'gelir')
    .reduce((toplam, t) => toplam + t.amount, 0);
}

export function hesaplaGider(transactions: Transaction[]): number {
  return transactions
    .filter((t) => t.type === 'gider')
    .reduce((toplam, t) => toplam + t.amount, 0);
}
