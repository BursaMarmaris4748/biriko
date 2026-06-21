import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Modal,
  ActivityIndicator,
  Alert,
  TextInput,
  ScrollView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { parseReceiptGroq, ReceiptData } from '@/services/receipt-parser-groq';
import {
  getGroqApiKey,
  getGroqModel,
  setGroqApiKey,
} from '@/services/config';

interface ReceiptScannerProps {
  visible: boolean;
  onClose: () => void;
  onParsed: (data: { amount: number; category: string; note: string }) => void;
}

const KATEGORI_RENKLERI = [
  'bg-rose-100', 'bg-sky-100', 'bg-amber-100', 'bg-emerald-100',
  'bg-purple-100', 'bg-cyan-100', 'bg-orange-100', 'bg-teal-100',
];

export const ReceiptScanner: React.FC<ReceiptScannerProps> = ({
  visible,
  onClose,
  onParsed,
}) => {
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [parsedData, setParsedData] = useState<ReceiptData | null>(null);
  const [showApiConfig, setShowApiConfig] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState(getGroqApiKey());

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('İzin Gerekli', 'Kamera kullanımı için izin gerekiyor.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      if (asset.base64) {
        setImage(asset.base64);
        await processReceipt(asset.base64);
      }
    }
  };

  const pickFromGallery = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('İzin Gerekli', 'Galeri erişimi için izin gerekiyor.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      if (asset.base64) {
        setImage(asset.base64);
        await processReceipt(asset.base64);
      }
    }
  };

  const processReceipt = async (base64: string) => {
    setLoading(true);
    setParsedData(null);

    const apiKey = getGroqApiKey();
    if (!apiKey) {
      setLoading(false);
      Alert.alert(
        'API Anahtarı Gerekli',
        'Groq API anahtarı ayarlanmamış. console.groq.com/keys adresinden ücretsiz anahtar alın.'
      );
      return;
    }

    try {
      const data = await parseReceiptGroq(base64, apiKey, getGroqModel());
      setLoading(false);

      if (!data.toplam || data.toplam <= 0) {
        Alert.alert(
          'Fiş Okunamadı',
          'Fişteki toplam tutar bulunamadı. Lütfen daha net bir fotoğraf çekmeyi deneyin.'
        );
        return;
      }

      setParsedData(data);
    } catch (err: any) {
      setLoading(false);
      const message = err.message || '';
      if (message.includes('401') || message.includes('unauthorized') || message.includes('Invalid')) {
        Alert.alert('API Anahtarı Geçersiz', 'Groq API anahtarınız geçersiz.');
      } else if (message.includes('not found') || message.includes('404')) {
        Alert.alert('Model Bulunamadı', 'Model adı güncel değil.');
      } else if (message.includes('429') || message.includes('RATE_LIMIT')) {
        Alert.alert('Limit Aşıldı', 'Çok fazla istek. Birkaç saniye bekleyin.');
      } else if (message.includes('413') || message.includes('too large')) {
        Alert.alert('Görsel Çok Büyük', 'Daha düşük kaliteyle tekrar çekin.');
      } else {
        Alert.alert('Fiş Okunamadı', `Hata: ${message}`);
      }
    }
  };

  const handleGidereEkle = () => {
    if (!parsedData || !parsedData.toplam) return;
    onParsed({
      amount: parsedData.toplam,
      category: parsedData.magaza || 'Market',
      note: `${parsedData.magaza ? parsedData.magaza + ' - ' : ''}Fiş No: ${parsedData.fis_no || '—'}`,
    });
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 bg-[#f2f5f9]">
        {/* Header */}
        <View className="flex-row items-center justify-between px-5 pt-14 pb-4 bg-white">
          <TouchableOpacity onPress={onClose}>
            <MaterialCommunityIcons name="close" size={26} color="#151c27" />
          </TouchableOpacity>
          <Text className="text-[#151c27] font-bold text-lg">
            {parsedData ? 'Fiş Özeti' : 'Fiş Tara'}
          </Text>
          <View style={{ width: 26 }} />
        </View>

        {loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#0058bc" />
            <Text className="text-[#414754] text-base mt-4">Fiş okunuyor...</Text>
          </View>
        ) : showApiConfig ? (
          <View className="flex-1 items-center justify-center px-10 bg-[#f2f5f9]">
            <Text className="text-[#151c27] text-lg font-semibold mb-2">API Anahtarı Ayarla</Text>
            <Text className="text-[#414754] text-center text-sm mb-6">
              console.groq.com/keys adresinden alın
            </Text>
            <TextInput
              className="w-full bg-white text-[#151c27] text-base rounded-xl px-4 py-3 mb-4 border border-[#c1c6d7]"
              placeholder="gsk_ ile başlayan anahtar"
              placeholderTextColor="#888"
              value={apiKeyInput}
              onChangeText={setApiKeyInput}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity
              onPress={() => {
                if (apiKeyInput.trim()) {
                  setGroqApiKey(apiKeyInput.trim());
                  setShowApiConfig(false);
                  Alert.alert('Tamam', 'Groq API anahtarı kaydedildi.');
                }
              }}
              className="bg-[#0058bc] py-4 px-10 rounded-xl w-full mb-4"
            >
              <Text className="text-white font-bold text-base text-center">Kaydet</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowApiConfig(false)} className="py-4">
              <Text className="text-[#414754] text-base text-center">Geri</Text>
            </TouchableOpacity>
          </View>
        ) : !parsedData ? (
          <View className="flex-1 items-center justify-center px-10 bg-[#f2f5f9]">
            <View className="w-24 h-24 rounded-full bg-white items-center justify-center mb-6 shadow-sm">
              <MaterialCommunityIcons name="camera" size={44} color="#0058bc" />
            </View>
            <Text className="text-[#151c27] text-center text-lg font-semibold mb-2">
              Fiş Fotoğrafı Çek
            </Text>
            <Text className="text-[#414754] text-center text-sm mb-8">
              Fişin net bir fotoğrafını çekin, yapay zeka otomatik okusun
            </Text>
            <TouchableOpacity
              onPress={takePhoto}
              className="bg-[#0058bc] py-4 px-10 rounded-xl mb-4 w-full"
            >
              <Text className="text-white font-bold text-base text-center">Fotoğraf Çek</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={pickFromGallery}
              className="bg-white py-4 px-10 rounded-xl w-full mb-4 border border-[#c1c6d7]"
            >
              <Text className="text-[#151c27] font-bold text-base text-center">Galeriden Seç</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => { setApiKeyInput(getGroqApiKey()); setShowApiConfig(true); }}
              className="py-2"
            >
              <Text className="text-[#727786] text-sm text-center">
                {getGroqApiKey() ? 'API Anahtarını Değiştir' : 'API Anahtarı Ayarla'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* FİŞ ÖZETİ - Parsed data */
          <View className="flex-1 bg-[#f2f5f9]">
            {image && (
              <Image
                source={{ uri: `data:image/jpeg;base64,${image}` }}
                className="w-full h-32"
                resizeMode="cover"
                blurRadius={4}
              />
            )}
            <ScrollView className="flex-1 px-4 pt-4">
              {/* Mağaza Kartı */}
              <View className="bg-white rounded-2xl p-5 mb-4 shadow-sm border border-[#e7eefe]">
                <View className="flex-row items-center justify-between mb-3">
                  <View className="flex-row items-center gap-3">
                    <View className="w-12 h-12 rounded-full bg-[#e7eefe] items-center justify-center">
                      <MaterialCommunityIcons name="store" size={24} color="#0058bc" />
                    </View>
                    <View>
                      <Text className="text-[#151c27] font-bold text-lg">
                        {parsedData.magaza || 'Mağaza'}
                      </Text>
                      {parsedData.tarih && (
                        <Text className="text-[#727786] text-xs">{parsedData.tarih}</Text>
                      )}
                    </View>
                  </View>
                  <View className="items-end">
                    <Text className="text-[#727786] text-xs">Toplam</Text>
                    <Text className="text-[#0058bc] font-bold text-2xl">
                      ₺{parsedData.toplam?.toFixed(2)}
                    </Text>
                  </View>
                </View>
                {parsedData.fis_no && (
                  <View className="flex-row items-center gap-1">
                    <MaterialCommunityIcons name="receipt" size={14} color="#727786" />
                    <Text className="text-[#727786] text-xs">Fiş No: {parsedData.fis_no}</Text>
                  </View>
                )}
                {parsedData.odeme_yontemi && (
                  <View className="flex-row items-center gap-1 mt-1">
                    <MaterialCommunityIcons name="credit-card" size={14} color="#727786" />
                    <Text className="text-[#727786] text-xs">{parsedData.odeme_yontemi}</Text>
                  </View>
                )}
              </View>

              {/* Ürün Listesi */}
              <Text className="text-[#151c27] font-bold text-base mb-3 px-1">
                Ürünler ({parsedData.urunler.length} adet)
              </Text>

              {parsedData.urunler.map((urun, idx) => (
                <View
                  key={idx}
                  className="bg-white rounded-xl px-4 py-3 mb-2 border border-[#e7eefe] flex-row items-center"
                >
                  <View
                    className={`w-8 h-8 rounded-full ${KATEGORI_RENKLERI[idx % KATEGORI_RENKLERI.length]} items-center justify-center mr-3`}
                  >
                    <MaterialCommunityIcons name="shopping-outline" size={16} color="#414754" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-[#151c27] text-sm font-semibold" numberOfLines={1}>
                      {urun.ad}
                    </Text>
                    <Text className="text-[#727786] text-xs">
                      {urun.adet} adet{urun.birim ? ` × ${urun.birim_fiyat?.toFixed(2)}` : ''}
                    </Text>
                  </View>
                  <Text className="text-[#151c27] font-bold text-sm">
                    ₺{urun.toplam_fiyat.toFixed(2)}
                  </Text>
                </View>
              ))}

              {/* Ödeme Özeti */}
              <View className="bg-white rounded-2xl p-5 mt-2 mb-4 shadow-sm border border-[#e7eefe]">
                <View className="flex-row justify-between items-center mb-2">
                  <Text className="text-[#727786] text-sm">Ara Toplam</Text>
                  <Text className="text-[#151c27] text-sm">₺{parsedData.toplam?.toFixed(2)}</Text>
                </View>
                {parsedData.kdv_toplam != null && (
                  <View className="flex-row justify-between items-center mb-2">
                    <Text className="text-[#727786] text-sm">KDV</Text>
                    <Text className="text-[#151c27] text-sm">₺{parsedData.kdv_toplam.toFixed(2)}</Text>
                  </View>
                )}
                <View className="border-t border-[#e7eefe] pt-2 mt-1 flex-row justify-between items-center">
                  <Text className="text-[#151c27] font-bold text-base">Genel Toplam</Text>
                  <Text className="text-[#0058bc] font-bold text-xl">₺{parsedData.toplam?.toFixed(2)}</Text>
                </View>
              </View>
            </ScrollView>

            {/* Gidere Ekle Butonu */}
            <View className="px-4 pb-6 pt-3 bg-[#f2f5f9]">
              <TouchableOpacity
                onPress={handleGidereEkle}
                className="bg-[#0058bc] py-4 rounded-2xl flex-row items-center justify-center gap-2 shadow-lg"
                style={{ shadowColor: '#0058bc', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 }}
              >
                <MaterialCommunityIcons name="plus-circle" size={22} color="#ffffff" />
                <Text className="text-white font-bold text-base">Gidere Ekle</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
};

export default ReceiptScanner;
