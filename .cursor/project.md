# Çağrı Merkezi Kalite Değerlendirme Programı

## Amaç ve Hedefler
Bu proje, müşteri memnuniyetini artırmak, çağrı merkezi performansını ölçmek ve geliştirmek için kalite değerlendirme sistemidir.

## Kullanıcı Rolleri
- **Müşteri Temsilcisi**: Sadece kendi değerlendirmelerini görür. Genel performansı takip eder.
- **Kalite Uzmanı**: Çağrı değerlendirmesi yapar, raporlara ve analizlere erişir.
- **Yönetici**: Kullanıcı ve sistem yönetimi yapar, form ve rol tanımlarını düzenler.

## Veri Girişleri
- MP3 çağrı kayıtları (çift kanal ses dosyaları).
- Web tabanlı değerlendirme formu ile puanlama ve açıklamalar girilir.

## Değerlendirme Formu
| Kriter                                     | Max Puan |
|--------------------------------------------|----------|
| Açılış ve Karşılama                        | 5        |
| Etkin Dinleme ve Anlama                    | 15       |
| Analiz ve Etkin Soru Sorma                 | 15       |
| Görüşme Kirliliği                          | 10       |
| Ses Tonu                                   | 10       |
| Sorunu Sahiplenme                          | 5        |
| Empati                                     | 5        |
| Süre ve Stres Yönetimi                     | 5        |
| Doğru Yönlendirme                          | 10       |
| Bilgiyi Paylaşma ve İkna                   | 10       |
| Kapanış Anonsu                             | 5        |
| Yönlendirilen Ekip Bilgisi                 | 5        |

- Hata durumları (0 veya %50 puan düşer seçenekleri olacak şekilde checkbox ile işaretlenir).

## Arayüz Gereksinimleri
- Kullanıcı dostu (orta düzey kullanıcı becerisine uygun).
- Dashboard ekranları:
  - Kalite Uzmanı Dashboard (Leaderboard, çağrı istatistikleri)
  - Müşteri Temsilcisi Dashboard (Kendi puanları, TOP 10 listesi)

## Raporlama
- Trend analizleri, karşılaştırmalı raporlar.
- PDF, Excel çıktıları.

## Gelecek Entegrasyonlar
- CRM, LLM ve AI entegrasyonlarına uyumlu altyapı hazırlığı.
