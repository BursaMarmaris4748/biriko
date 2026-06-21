import React, { useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { GelirGiderKarti } from '@/components/gelir-gider-karti';
import { IslemEkleModal } from '@/components/islem-ekle-modal';
import { getScannedData } from '@/services/scan-store';
import { useFinance } from '@/services/finance-context';

export default function HomeScreen() {
  const { addTransaction } = useFinance();
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'gelir' | 'gider'>('gelir');
  const [modalAmount, setModalAmount] = useState<string | undefined>();
  const [modalCategory, setModalCategory] = useState<string | undefined>();
  const [modalNote, setModalNote] = useState<string | undefined>();

  useFocusEffect(
    useCallback(() => {
      const scanned = getScannedData();
      if (scanned) {
        setModalType('gider');
        setModalAmount(scanned.amount.toString());
        setModalCategory(scanned.category);
        setModalNote(scanned.note);
        setModalVisible(true);
      }
    }, [])
  );

  const handleGelirEkle = () => {
    setModalType('gelir');
    setModalAmount(undefined);
    setModalCategory(undefined);
    setModalNote(undefined);
    setModalVisible(true);
  };

  const handleGiderEkle = () => {
    setModalType('gider');
    setModalAmount(undefined);
    setModalCategory(undefined);
    setModalNote(undefined);
    setModalVisible(true);
  };

  const handleSave = async (data: { type: 'gelir' | 'gider'; amount: number; category: string; note: string }) => {
    await addTransaction(data);
  };

  return (
    <>
      <GelirGiderKarti
        onGelirEkle={handleGelirEkle}
        onGiderEkle={handleGiderEkle}
      />
      <IslemEkleModal
        visible={modalVisible}
        initialType={modalType}
        initialAmount={modalAmount}
        initialCategory={modalCategory}
        initialNote={modalNote}
        onClose={() => setModalVisible(false)}
        onSave={handleSave}
      />
    </>
  );
}
