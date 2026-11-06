# Akdo QR Menü ve AI Yönetim Paneli

Akdo Dondurma için mobil uyumlu, kategori filtreli ve aranabilir QR menüsü ile
Türkçe doğal dil komutlarını ürün işlemlerine dönüştüren bir yönetim paneli.

## Başlangıç

1. Node.js 20.19+ kurun ve proje bağımlılıklarını yükleyin:

   ```powershell
   npm install
   ```

2. Ortam dosyasını oluşturun:

   ```powershell
   Copy-Item .env.example .env
   ```

   `.env` içinde `ADMIN_USERNAME` ve `ADMIN_PASSWORD` yönetici giriş bilgilerini,
   `ADMIN_SESSION_SECRET` için rastgele ve uzun bir değer belirleyin. Personel
   hesaplarını yönetim panelindeki `/login/employees` alanından oluşturabilir;
   isterseniz `CHEF_USERNAME`/`CHEF_PASSWORD` ve `WAITER_USERNAME`/
   `WAITER_PASSWORD` ortam değişkenleriyle de tanımlayabilirsiniz. AI sohbeti
   için `OPENAI_API_KEY` alanına OpenAI API anahtarınızı ekleyin. Bu anahtarı
   istemci koduna koymayın.

3. Boş SQLite veritabanını oluşturun:

   ```powershell
   npm run db:setup
   ```

   Başlangıçta örnek kategori veya ürün eklenmez. Menü içeriğini `/login`
   adresindeki yönetim panelinden oluşturabilirsiniz. Şubeleri `/login/branches`
   alanından ekleyebilir; şehir, ilçe ve adres bilgilerini girebilir. Panelde
   şube seçerek her şubenin kategori ve ürün menüsünü ayrı yönetebilirsiniz.
   Ziyaretçilere varsayılan şubenin menüsü gösterilir.
   İl ve ilçe seçim listesi, Unlicense ile kamuya açılmış
   [Türkiye il/ilçe veri kümesini](https://github.com/tolga1283/turkey-cities-districts)
   temel alır.
   Kategori, menü ve çalışan bölümleri sırasıyla `/login/categories`,
   `/login/menu` ve `/login/employees` adreslerinde açılır. `/login/tables`
   alanından her masa için benzersiz altı haneli kod oluşturup kullanıma
   açabilirsiniz.
   Var olan bir veritabanına masa ve sipariş tablolarını eklemek için
   `npm run db:push` komutunu çalıştırın. Üye sistemi için yönetici panelindeki
   `/login/users` alanından üye oluşturun ve başlangıç bakiyesi belirleyin.
   Üyeler `/uye` adresinden kayıt olur veya 8 haneli üye numaralarıyla giriş
   yapar. Telefon isteğe bağlıdır. Sipariş verebilmek için üyenin sipariş
   toplamını karşılayacak kadar AkdoKasa bakiyesi olmalıdır.
   Masa, üye, bakiye hareketi ve personel hesapları modellerini yerel veritabanına
   eklemek veya güncellemek için `npm run db:setup` komutunu çalıştırın.

4. Geliştirme sunucusunu başlatın:

   ```powershell
   npm run dev
   ```

   - QR menü: <http://localhost:3000>
   - QR menü: <http://localhost:3000/qr-46/menu>
   - Masadan sipariş: <http://localhost:3000/masa-siparis>
   - AkdoŞef: <http://localhost:3000/akdosef>
   - AkdoGarson: <http://localhost:3000/akdogarson>
   - Yönetim paneli: <http://localhost:3000/login>

Masadan sipariş akışında müşteri masa kodunu girip ürünleri sepete ekler.
Şef siparişi alıp hazırlamaya başlar ve hazır olduğunda AkdoGarson kuyruğuna
aktarır. Garson teslimi onayladığında müşteri, siparişini özel takip bağlantısında
otomatik güncellenen durum adımlarıyla görür.

Üyeler `/uye` profilinden sipariş, bakiye hareketi ve bakiye yükleme taleplerini
izleyebilir. Bakiye yükleme talebi çevrim içi ödeme değildir; AkdoKasa ekranında
yetkili personel gerçek tahsilatı doğruladıktan sonra üye bakiyesine işlenir.
Giriş yapmış üyeler ana sayfadaki menü ürünlerini sepete ekleyip aynı sayfada
masa koduyla sipariş verebilir; sipariş sonrasında menü sayfasında kalırlar.
Sipariş tutarı sunucuda da doğrulanır ve işlem, yeterli üye bakiyesiyle atomik
olarak tahsil edilir; bakiyesi yetersiz üyeler için sipariş kaydı oluşturulmaz.
Siparişlerin nakit veya harici POS tahsilatı da AkdoKasa üzerinden sipariş ve
masa bilgisiyle iç kayıt olarak tutulur. Harici POS, ödeme sağlayıcısı
entegrasyonu anlamına gelmez. Bu iç kayıtlar mali belge yerine geçmez; uygulamada
e-Fatura, e-Arşiv veya ÖKC entegrasyonu bulunmaz.
Yönetim panelindeki `/login/defter` finans defteri, tüm şubelerin ödenmiş
siparişlerini, onaylı bakiye yüklemelerini ve bakiye düzeltmelerini tarih,
işlem türü ve aramayla listeler. AkdoKasa ile ödenen siparişler satış ve bakiye
düşümü olarak görünür; nakit giriş toplamına ikinci kez eklenmez.

Yönetim panelinde ürün görseli eklerken dosyayı sürükleyip bırakabilir veya
dosya seçebilirsiniz. PNG, JPEG, WebP ve GIF dosyaları 5 MB sınırıyla kabul
edilir; yüklenen dosyalar `public/uploads` altında saklanır. Üretimde bu dizin
kalıcı disk veya paylaşımlı depolama ile korunmalıdır; geçici dosya sistemli
sunucularda yüklemeler dağıtımlar arasında kalıcı olmaz. Eski dış görsel
bağlantıları da desteklenir ve dış alan adı nedeniyle menünün hata vermemesi
için ürün görselleri Next.js görsel optimizasyonu kullanılmadan gösterilir.

Eski `/1-qr-elbistan-46/menu` adresi, mevcut basılı QR kodları çalışmaya devam
etsin diye otomatik olarak yeni `/qr-46/menu` adresine yönlendirilir.

AI kullanımı için geçerli bir `OPENAI_API_KEY` gerekir. Anahtar tanımlı değilse
menü ve yönetici girişi çalışır; sohbet API'si açık bir yapılandırma hatası verir.

## AI yönetim komutları

Yönetici panelinde örnek olarak şunları yazabilirsiniz:

- `Menüye 120 TL'ye Fıstıklı Baklava ekle, açıklaması taze çıtır baklava olsun.`
- `Maraş Dondurması fiyatını 100 TL yap.`
- `Stokta kalmayan içecekleri gizle.`

Komutlar Vercel AI SDK araçları üzerinden doğrulanır ve Prisma ile veritabanına
yazılır. İşlem tamamlanınca sohbet akışında bir onay kartı gösterilir. Yönetim
paneli parola korumalıdır; sekiz saatlik oturum HttpOnly imzalı çerezle tutulur.

## Proje yapısı

```text
prisma/
  schema.prisma                 SQLite şema ve masa sipariş modelleri
  seed.ts                       Örnek menü verisi yüklemez
src/
  app/
    login/page.tsx              Kullanıcı adı/parola korumalı yönetim sayfası
    login/branches/page.tsx     Şube ekleme ve düzenleme sayfası
    login/categories/page.tsx   Kategori yönetimi sayfası
    login/menu/page.tsx         Menü yönetimi sayfası
    login/employees/page.tsx    Çalışanlar sayfası
    login/defter/page.tsx       Tüm şubelerin finans hareketleri ve kasa özeti
    login/tables/page.tsx       Şubeye özel masa ve altı haneli kod yönetimi
    login/users/page.tsx        Üye oluşturma, bilgi düzenleme ve bakiye yönetimi
    uye/page.tsx                Üye kaydı ve üye numarasıyla giriş
    akdosef/page.tsx            Şef sipariş kuyruğu
    akdogarson/page.tsx         Garson teslim kuyruğu
    masa-siparis/page.tsx       Müşteri sipariş oluşturma
    siparis-takip/[trackingToken]/page.tsx  Müşteri sipariş takibi
    admin/page.tsx              /login yönlendirmesi
    api/admin/categories/       Kategori oluşturma uç noktası
    api/admin/products/         Ürün oluşturma uç noktası
    api/admin/tables/           Masa ve kod yönetimi uç noktaları
    api/admin/ledger/           Yönetici oturumuyla filtrelenmiş finans defteri
    api/orders/                 Masa kodu menüsü, sipariş ve takip uç noktaları
    api/staff/                  Personel girişi, sipariş kuyruğu ve durum işlemleri
    api/members/                Üye kaydı, girişi ve oturum işlemleri
    api/admin/members/          Üye yönetimi ve bakiye hareketleri
    qr-46/menu/                 QR menü rotası
    api/admin/chat/route.ts      AI SDK sohbet ve tool-calling uç noktası
    api/admin/login/route.ts     Yönetici oturumu oluşturma
    api/admin/logout/route.ts    Yönetici oturumunu kapatma
    globals.css                 Tailwind ve marka tasarım değişkenleri
    page.tsx                    Genel QR menüsü
  components/
    admin/                      Admin sayfaları ve yönetim bileşenleri
    menu/                        QR menüsü ve yüklenme iskeleti
    ui/                          Shadcn UI bileşenleri
  lib/
    admin-auth.ts               Oturum ve parola doğrulaması
    staff-auth.ts               Şef/garson rol oturumları
    member-auth.ts              Üye parolası ve imzalı oturum doğrulaması
    ai-tools.ts                 Ürün ekleme, güncelleme ve stok araçları
    menu-data.ts                Menü verisi ve sunucu tarafı eşleme
    prisma.ts                   Prisma istemci tekil örneği
```

## Kontroller

```powershell
npm run lint
npm run build
```

## Render demo dağıtımı

Depoda Render Free web servisi için `render.yaml` blueprint'i bulunur. Render'da
bu depoyu bağlayıp istenen ortam değişkenlerini panelden girin. PostgreSQL
veritabanını ayrı oluşturun (örneğin Supabase Free) ve session-pooler bağlantı
adresini `DATABASE_URL` olarak kullanın. Veritabanı parolasını ve uygulama
gizli anahtarlarını yalnızca servis sağlayıcısının secret alanlarına girin;
depo dosyalarına eklemeyin.

Her dağıtım derlemesinde Render `prisma migrate deploy` komutunu çalıştırır;
`DATABASE_URL` değişkeni derleme başlamadan önce tanımlanmalıdır. Render
`prisma migrate deploy` ve güvenli, tekrarlanabilir demo seed'ini derleme
sırasında çalıştırır. Seed yalnızca şube, masa, kategori ve örnek ürün ekler;
varsayılan parolalı hesap oluşturmaz ve mevcut kayıtları ezmez. Erişim vermeden
önce `ADMIN_*`, `CHEF_*` ve `WAITER_*` değişkenlerine benzersiz kimlik
bilgileri girin.

Bu ücretsiz kurulum yalnızca demo/test içindir. Render Free servisleri uykuya
geçebilir ve yerel disk kalıcı değildir. `public/uploads` altına yüklenen
görseller yeniden başlatma veya dağıtım sonrasında kaybolabilir; yüklemelere
güvenmeden önce kalıcı nesne depolaması kullanın. Supabase Free projeleri de
etkinlik olmadığında duraklatılabilir. Gerçek müşteri, bakiye veya sipariş
verilerini demo ortamına kopyalamayın.
