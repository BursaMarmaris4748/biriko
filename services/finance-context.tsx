import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  Transaction,
  SavingsGoal,
  SavingsContribution,
  BirikimPeriyot,
  loadData,
  addTransaction as storageAdd,
  deleteTransaction as storageDelete,
  setSavingsGoal as storageSetGoal,
  updateSavingsGoal as storageUpdateGoal,
  addSavingsContribution as storageAddContribution,
  deleteSavingsGoal as storageDeleteGoal,
  hesaplaGelir,
  hesaplaGider,
} from './storage';

interface FinanceContextType {
  transactions: Transaction[];
  totalGelir: number;
  totalGider: number;
  net: number;
  loading: boolean;
  savingsGoals: SavingsGoal[];
  addTransaction: (data: {
    type: 'gelir' | 'gider';
    amount: number;
    category: string;
    note: string;
    date?: string;
  }) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  setSavingsGoal: (data: { name: string; targetAmount: number; period: BirikimPeriyot; targetDate?: string }) => Promise<void>;
  addSavingsContribution: (data: { goalId: string; amount: number; note?: string }) => Promise<void>;
  deleteSavingsGoal: (goalId: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const FinanceContext = createContext<FinanceContextType | null>(null);

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const data = await loadData();
    setTransactions(data.transactions);
    setSavingsGoals(data.savingsGoals);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addTransaction = useCallback(async (data: {
    type: 'gelir' | 'gider'; amount: number; category: string; note: string; date?: string;
  }) => {
    const result = await storageAdd({
      type: data.type, amount: data.amount, category: data.category, note: data.note,
      date: data.date || new Date().toISOString().split('T')[0],
    });
    setTransactions(result.transactions);
  }, []);

  const deleteTransaction = useCallback(async (id: string) => {
    const result = await storageDelete(id);
    setTransactions(result.transactions);
  }, []);

  const setSavingsGoal = useCallback(async (data: {
    name: string; targetAmount: number; period: BirikimPeriyot; targetDate?: string;
  }) => {
    const result = await storageSetGoal(data);
    setSavingsGoals(result.savingsGoals);
  }, []);

  const addSavingsContribution = useCallback(async (data: { goalId: string; amount: number; note?: string }) => {
    const result = await storageAddContribution(data);
    setSavingsGoals(result.savingsGoals);
  }, []);

  const deleteSavingsGoal = useCallback(async (goalId: string) => {
    const result = await storageDeleteGoal(goalId);
    setSavingsGoals(result.savingsGoals);
  }, []);

  const totalGelir = hesaplaGelir(transactions);
  const totalGider = hesaplaGider(transactions);
  const net = totalGelir - totalGider;

  return (
    <FinanceContext.Provider
      value={{
        transactions,
        totalGelir,
        totalGider,
        net,
        loading,
        savingsGoals,
        addTransaction,
        deleteTransaction,
        setSavingsGoal,
        addSavingsContribution,
        deleteSavingsGoal,
        refresh,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
}

export function useFinance(): FinanceContextType {
  const ctx = useContext(FinanceContext);
  if (!ctx) throw new Error('useFinance must be used within FinanceProvider');
  return ctx;
}
