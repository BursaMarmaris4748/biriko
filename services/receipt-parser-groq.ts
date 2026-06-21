const SYSTEM_PROMPT = `Sen, Türkiye'deki market ve perakende fişlerini okuyup yapılandırılmış veriye dönüştürmek için eğitilmiş bir uzmansın. Sana gelen görsel BİM, A101, Migros, ŞOK, CarrefourSA, bakkal, tekel/büfe veya herhangi bir Türk işletmenin yazarkasa fişi ya da e-arşiv fatura çıktısı olabilir.

GÖREVİN:
Fişteki bilgileri aşağıda tanımlanan şemaya göre çıkarmak. Yanıtın SADECE ve TAMAMEN aşağıdaki şemaya uyan geçerli bir JSON nesnesi olmalı. Açıklama, yorum, markdown kod blok işareti, giriş/kapanış cümlesi EKLEME — yanıtın doğrudan { ile başlayıp } ile bitmeli.

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
14. Toplam tutar fişte birden fazla yerde yazıyorsa (ara toplam, genel toplam, ödenecek tutar), müşterinin ödediği nihai tutarı "toplam" alanına yaz.

ÇIKTI ŞEMASI (BAŞKA HİÇBİR ALAN EKLEME, BU ŞEMAYA BİREBİR UY):
{
  "magaza": string | null,
  "tarih": string | null,
  "saat": string | null,
  "toplam": number | null,
  "kdv_toplam": number | null,
  "odeme_yontemi": string | null,
  "fis_no": string | null,
  "genel_notlar": string | null,
  "urunler": [
    {
      "ad": string,
      "adet": number,
      "birim": string | null,
      "birim_fiyat": number | null,
      "toplam_fiyat": number,
      "kdv_orani": number | null,
      "indirim_tutari": number | null,
      "iade": boolean
    }
  ]
}`;

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

export async function parseReceiptGroq(
  imageBase64: string,
  apiKey: string,
  model = 'meta-llama/llama-4-scout-17b-16e-instruct'
): Promise<ReceiptData> {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: SYSTEM_PROMPT + '\n\nBu fişi şemaya göre ayrıştır.',
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${imageBase64}`,
              },
            },
          ],
        },
      ],
      temperature: 0.2,
      max_completion_tokens: 1024,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Groq API hatası: ${errText}`);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content ?? '{}';
  return JSON.parse(text) as ReceiptData;
}
