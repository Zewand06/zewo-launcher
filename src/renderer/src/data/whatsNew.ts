// Ana menüdeki "Yenilikler" kutusunun içeriği. Her yeni sürümde bu iki
// alanı güncelle — kod tarafında başka bir şey değiştirmene gerek yok.
export const WHATS_NEW = {
  version: '0.1.4',
  items: [
    'Profil ekranı yenilendi: oyuncu kafan, kayıt tarihin, son giriş zamanın, toplam oynama sürenin ve en çok oynadığın sürüm artık ayrı ayrı kutucuklarda net bir şekilde gösteriliyor.',
    'Rol ve yetki sistemi geldi (Üye/VIP/Moderatör/Admin) — yöneticiler artık kimin hangi yetkiye sahip olduğunu ayrı bir yetki matrisinden ayarlayabiliyor, rol/kozmetik atamaları tek panelden yapılıyor.',
    'Her Minecraft sürümü artık kendi gerektirdiği Java sürümünü otomatik indirip kuruyor (ör. yeni sürümler için Java 25) — "sürüm uyuşmazlığı" hataları tamamen ortadan kalktı.',
    'Sodium ve Iris\'in birbiriyle uyumsuz sürümleri yüzünden oluşan "Incompatible mods" çökmesi düzeltildi — performans modları artık her zaman uyumlu çiftler halinde kuruluyor.',
    'Discord\'da artık "Zewo Launcher" durumu görünüyor: menüdeyken ve oyun içindeyken (sürüm, rolün ve oynama sürenle birlikte) profilinde gösteriliyor.',
    'Yepyeni logo ve karanlık kırmızı-siyah tema — uygulama içinde her yerde ve masaüstü kısayol simgesinde.',
    'Premium hesaplarda artık gerçek Minecraft skin\'in gösteriliyor; premium olmayan girişte de o kullanıcı adı sana aitse yine gerçek skin bulunuyor, yoksa resmi Alex skin\'i kullanılıyor.'
  ]
} as const
