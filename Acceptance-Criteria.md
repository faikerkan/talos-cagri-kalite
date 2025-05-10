# Acceptance-Criteria.md

- Kullanıcılar giriş yapıp dashboard'larını görebilir.
- Kalite Uzmanı MP3 dosya yükleyebilir, formu doldurup kaydedebilir.
- Formda doldurulan bilgiler veritabanına eksiksiz kaydedilir.
- Yüklenen MP3 dosyaları ön yüzde sorunsuz oynatılır.
- Dashboard gerçek zamanlı veri sağlar.
- Kullanıcı yetkilendirme sorunsuz çalışır.
- Raporlar PDF ve Excel formatlarında oluşturulabilir.

# Kullanıcı Kabul Testleri

## Temel Fonksiyonlar

1. **Giriş ve Kimlik Doğrulama**
   - [x] Kullanıcı sisteme giriş yapabilmeli
   - [x] Yetkilendirme sistemine göre farklı rollere (müşteri temsilcisi, kalite uzmanı, yönetici) uygun ekranlar gösterilmeli

2. **MP3 Dosya Yükleme**
   - [x] Kalite uzmanı çağrı kaydı olarak MP3 dosyası yükleyebilmeli
   - [x] Yüklenen dosyalar düzgün bir şekilde kaydedilmeli ve oynatılabilmeli

3. **Değerlendirme Formu**
   - [x] Kalite uzmanı çağrıları değerlendirebilmeli
   - [x] Kriter bazlı puanlama yapılabilmeli
   - [x] Penalty (ceza) durumları işaretlenebilmeli (%50 ve tam puan kaybı)
   - [x] Notlar eklenebilmeli

4. **Dashboard ve Raporlama**
   - [x] Kalite uzmanları ve yöneticiler istatistikleri görebilmeli
   - [x] Kriter bazlı penalty istatistikleri görselleştirilebilmeli
   - [x] Trend analizleri farklı zaman aralıklarında görüntülenebilmeli
   - [x] Mobil cihazlarda da raporlar doğru görüntülenebilmeli

5. **Excel ve PDF Export**
   - [x] İstatistik ve değerlendirme raporları Excel olarak indirilebilmeli
   - [x] İstatistik ve değerlendirme raporları PDF olarak indirilebilmeli

## Gelişmiş Özellikler

6. **Gelişmiş Filtreleme**
   - [x] Raporlar tarih aralığına göre filtrelenebilmeli
   - [x] Temsilci, değerlendiren ve puan aralığına göre filtreleme yapılabilmeli

7. **AI Entegrasyonu**
   - [x] Çağrı kayıtları otomatik olarak değerlendirilebilmeli
   - [x] AI-destekli değerlendirmeler manuel olarak gözden geçirilebilmeli

8. **Bildirim Sistemi**
   - [x] Düşük puanlı değerlendirmeler için bildirim gönderilebilmeli
   - [x] Bildirimlerde ilgili temsilci, değerlendiren ve yönetici bilgilendirilebilmeli

## Performans ve Kullanım Testleri

9. **Performans**
   - [ ] Sistem 100 eşzamanlı kullanıcıyı destekleyebilmeli
   - [ ] Dosya yükleme ve indirme işlemleri 10MB'a kadar sorunsuz çalışmalı

10. **Kullanılabilirlik**
    - [x] Arayüz sezgisel ve kolay kullanılabilir olmalı
    - [x] Mobil uyumlu tasarım doğru çalışmalı
    - [ ] Kullanıcı geri bildirimleri olumlu olmalı

## Test Onayı

- [ ] Tüm testler tamamlandı ve geçildi
- [ ] Kalite Ekibi onayı alındı
- [ ] Proje yöneticisi onayı alındı
