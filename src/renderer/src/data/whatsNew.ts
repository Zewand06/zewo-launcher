// Ana menüdeki "Yenilikler" kutusunun içeriği. Her yeni sürümde bu iki
// alanı güncelle — kod tarafında başka bir şey değiştirmene gerek yok.
export const WHATS_NEW = {
  version: '0.1.3',
  items: [
    'Yepyeni logo ve karanlık kırmızı-siyah tema — uygulama içinde her yerde ve masaüstü kısayol simgesinde.',
    'Sürüm seçici artık büyük butonlu, kaydırılabilir güzel bir listeye dönüştü.',
    'Premium hesaplarda artık gerçek Minecraft skin\'in gösteriliyor; premium olmayan girişte de o kullanıcı adı sana aitse yine gerçek skin bulunuyor, yoksa resmi Alex skin\'i kullanılıyor.',
    'Java 21 artık ilk açılışta otomatik indirilip kuruluyor — hangi bilgisayarda açarsan aç, "sürüm uyuşmazlığı" hatası bir daha yaşanmıyor.',
    'Sodium, Lithium ve Iris performans modları oyunla birlikte otomatik kuruluyor, FPS düşüşleri büyük ölçüde azaldı.',
    'Launcher artık kapatıp açtığında otomatik güncelleme kontrolü yapıyor ve yeni sürüm çıktığında seni bekletmeden güncelliyor.'
  ]
} as const
