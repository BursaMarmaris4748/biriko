let _scannedData: { amount: number; category: string; note: string } | null = null;

export function setScannedData(data: { amount: number; category: string; note: string }) {
  _scannedData = data;
}

export function getScannedData(): { amount: number; category: string; note: string } | null {
  const data = _scannedData;
  _scannedData = null;
  return data;
}

export function clearScannedData() {
  _scannedData = null;
}
