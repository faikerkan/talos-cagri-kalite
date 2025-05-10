# Çağrı Merkezi Kalite Yazılımı Workflow

## 🚀 Başlangıç (Proje Ayarları)
- [ ] GitHub'da repo oluştur
- [ ] Projeyi lokal ortamda kur (create-react-app ve express.js ile)
- [ ] PostgreSQL veritabanını kur

## 📂 Frontend Geliştirme
- [ ] Login/Kayıt ekranları
- [ ] Çağrı Değerlendirme Formu bileşeni oluştur
- [ ] Kalite Uzmanı Dashboard oluştur
- [ ] Müşteri Temsilcisi Dashboard oluştur
- [ ] Yönetici Paneli oluştur

## 🔧 Backend API
- [ ] Kullanıcı Yetkilendirme API'leri
- [ ] Çağrı Yükleme ve Değerlendirme API'leri
- [ ] Raporlama API'leri oluştur

## 🛠️ Entegrasyon ve Testler
- [ ] Frontend ve backend entegrasyonu
- [ ] Fonksiyonel testler ve hata düzeltmeleri
- [ ] MP3 yükleme testleri

## 🚦 Deployment
- [ ] Docker veya doğrudan sunucu kurulumunu yap
- [ ] SSL sertifikası kur
- [ ] Canlı ortama al ve test et


1. **Kullanıcı Kimlik Doğrulama**
   - Kullanıcılar JWT ile giriş yapar ve roller belirlenir (MT, Kalite Uzmanı, Yönetici).

2. **Çağrı Yükleme ve Değerlendirme**
   - Kalite uzmanı MP3 dosyasını yükler.
   - Çağrı formu doldurulur ve değerlendirme kaydedilir.

3. **Çağrı Görüntüleme**
   - MT, sadece kendi çağrılarını görüntüler.
   - Kalite Uzmanı, tüm çağrıları görebilir ve düzenleyebilir.

4. **Raporlama ve Dashboard**
   - Haftalık ve aylık raporlar otomatik oluşturulur.
   - Dashboard'da veriler anlık güncellenir.

5. **Yönetici İşlemleri**
   - Kullanıcı ve rol yönetimi yapılır.
   - Değerlendirme formu düzenlenir.
