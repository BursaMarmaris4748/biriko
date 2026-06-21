import React from 'react';
import { ReceiptScanner } from '@/components/receipt-scanner';
import { useRouter } from 'expo-router';
import { setScannedData } from '@/services/scan-store';

export default function ScannerScreen() {
  const router = useRouter();

  const handleParsed = (data: { amount: number; category: string; note: string }) => {
    setScannedData(data);
    router.back();
  };

  return (
    <ReceiptScanner
      visible
      onClose={() => router.back()}
      onParsed={handleParsed}
    />
  );
}
