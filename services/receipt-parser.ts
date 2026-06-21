const SYSTEM_PROMPT = `Sen, Türkiye'deki market ve perakende fişlerini okuyup yapılandırılmış veriye dönüştürmek için eğitilmiş bir uzmansın. Sana gelen görsel BİM, A101, Migros, ŞOK, CarrefourSA, bakkal, tekel/büfe veya herhangi bir Türk işletmenin yazarkasa fişi ya da e-arşiv fatura çıktısı olabilir.

GÖREVİN:
Fişteki bilgileri aşağıda tanımlanan şemaya göre çıkarmak. Sadece şemaya uygun JSON döndür — açıklama, yorum veya markdown kod bloğu ekleme.

OKUMA KURALLARI:
1. Emin olmadığın veya net okuyamadığın alanlara null koy. ASLA tahmin yürütme veya uydurma değer üretme.
2. Görsel bulanık, soluk veya kısmen kesikse, okuyabildiğin kadarını çıkar, geri kalanı null bırak.
3. Tarihleri her zaman YYYY-MM-DD formatına çevir (fişte GG.AA.YYYY, GG/AA/YY gibi farklı formatlarda olabilir).
4. Saatleri HH:MM (24 saat) formatına çevir.
5. Tüm parasal değerleri ondalık nokta ile sayı olarak yaz (virgül değil), örnek: 142.50 — TL/₺ işaretini sayıya dahil etme.
6. Bir ürün satırında iskonto/indirim varsa, ürünün indirimli (nihai) fiyatını "toplam_fiyat" alanına yaz, "indirim_tutari" alanına da indirim miktarını yaz.
7. İade/iptal satırlarını negatif tutar olarak işaretle ve "iade": true ekle.
8. Türk fişlerinde KDV oranları genelde %1 (temel gıda), %10 ve %20 (standart) şeklindedir. Her ürünün yanında küçük bir oran kodu (*, **, *** gibi) olabilir — bunu kdv_orani alanına sayısal yüzde olarak çevirmeye çalış, okuyamıyorsan null bırak.
9. Fiş numarası genelde "FİŞ NO", "ÖKC NO", "Z NO" gibi etiketlerle yazılı olur — bulduğunu fis_no alanına yaz.
10. Ödeme yöntemini (nakit/kredi kartı/temassız) fişte yazıyorsa odeme_yontemi alanına yaz, yoksa null bırak.
11. Mağaza adını fişin en üstünden, ünvanı değil halk arasında bilinen kısa adını çıkarmaya çalış (örnek: "BİM Birleşik Mağazalar A.Ş." yerine "BİM").
12. Ürün adlarını fişte yazdığı gibi (kısaltılmış olsa bile) aktar, açma/yorumlama yapma — örneğin "SUT TM YG 1L" yazıyorsa olduğu gibi bırak.
13. Birden fazla sayfa veya katlanmış fiş görüyorsan, sadece görünen kısmı işle ve genel_notlar alanına "fişin bir kısmı görünmüyor" gibi bir not düş.
14. Toplam tutar fişte birden fazla yerde yazıyorsa (ara toplam, genel toplam, ödenecek tutar), müşterinin ödediği nihai tutarı "toplam" alanına yaz.`;

const RECEIPT_SCHEMA = {
  type: 'OBJECT' as const,
  properties: {
    magaza: { type: 'STRING' as const, nullable: true },
    tarih: { type: 'STRING' as const, nullable: true },
    saat: { type: 'STRING' as const, nullable: true },
    toplam: { type: 'NUMBER' as const, nullable: true },
    kdv_toplam: { type: 'NUMBER' as const, nullable: true },
    odeme_yontemi: { type: 'STRING' as const, nullable: true },
    fis_no: { type: 'STRING' as const, nullable: true },
    genel_notlar: { type: 'STRING' as const, nullable: true },
    urunler: {
      type: 'ARRAY' as const,
      items: {
        type: 'OBJECT' as const,
        properties: {
          ad: { type: 'STRING' as const },
          adet: { type: 'NUMBER' as const },
          birim: { type: 'STRING' as const, nullable: true },
          birim_fiyat: { type: 'NUMBER' as const, nullable: true },
          toplam_fiyat: { type: 'NUMBER' as const },
          kdv_orani: { type: 'NUMBER' as const, nullable: true },
          indirim_tutari: { type: 'NUMBER' as const, nullable: true },
          iade: { type: 'BOOLEAN' as const },
        },
        required: ['ad', 'toplam_fiyat'],
      },
    },
  },
  required: ['urunler'],
};

export interface ReceiptData {
  magaza: string | null;
  tarih: string | null;
  saat: string | null;
  toplam: number | null;
  kdv_toplam: number | null;
  odeme_yontemi: string | null;
  fis_no: string | null;
  genel_notlar: string | null;
  urunler: Array<{
    ad: string;
    adet: number;
    birim: string | null;
    birim_fiyat: number | null;
    toplam_fiyat: number;
    kdv_orani: number | null;
    indirim_tutari: number | null;
    iade: boolean;
  }>;
}

export async function parseReceipt(
  imageBase64: string,
  apiKey: string,
  model = 'gemini-2.5-flash'
): Promise<ReceiptData> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: SYSTEM_PROMPT + '\n\nBu fişi şemaya göre ayrıştır.' },
              {
                inline_data: {
                  mime_type: 'image/jpeg',
                  data: imageBase64,
                },
              },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: RECEIPT_SCHEMA,
        },
      }),
    }
  );

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini API hatası: ${errText}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}';
  return JSON.parse(text) as ReceiptData;
}
