// Gerçek skin/cape sanat dosyaları eklenene kadar kullanılan, temaya uygun
// renklerden üretilen yer tutucu dokular. Düz/gradyan dolgu kullanıldığı için
// Minecraft'ın UV şablonunda yanlış hizalanma riski yok — hangi bölge
// örneklenirse örneklensin sonuç her zaman düzgün bir gradyan olur.

export function createPlaceholderSkin(): string {
  const canvas = document.createElement('canvas')
  canvas.width = 64
  canvas.height = 64
  const ctx = canvas.getContext('2d')
  if (!ctx) return ''
  const grad = ctx.createLinearGradient(0, 0, 64, 64)
  grad.addColorStop(0, '#4dd8c9')
  grad.addColorStop(1, '#8b7cf6')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, 64, 64)
  return canvas.toDataURL()
}

const CAPE_COLORS: Record<string, [string, string]> = {
  // Cape'ler
  Ember: ['#e8b563', '#7a4a1f'],
  Aurora: ['#4dd8c9', '#8b7cf6'],
  Void: ['#2a1f3d', '#0b0e1a'],
  Frost: ['#eaffff', '#4dd8c9'],
  Gold: ['#ffe08a', '#b8860b'],
  Nebula: ['#8b7cf6', '#e8697a'],
  // Kanatlar
  'Aurora Kanat': ['#4dd8c9', '#1c2a4a'],
  'Gölge Kanat': ['#2a1f3d', '#0b0e1a'],
  'Alev Kanat': ['#ffb347', '#b0202a'],
  'Buz Kanat': ['#eaffff', '#2f7f8f'],
  'Yıldız Kanat': ['#fff6d8', '#e8b563'],
  'Kök Kanat': ['#9ee66b', '#1f5c2e']
}

export function createPlaceholderCape(name: string, type: 'cape' | 'wings' = 'cape'): string {
  const canvas = document.createElement('canvas')
  canvas.width = 64
  canvas.height = 32
  const ctx = canvas.getContext('2d')
  if (!ctx) return ''
  const [c1, c2] = CAPE_COLORS[name] ?? ['#4dd8c9', '#8b7cf6']
  const grad = ctx.createLinearGradient(0, 0, 0, 32)
  grad.addColorStop(0, c1)
  grad.addColorStop(1, c2)
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, 64, 32)

  // Kanatlar için diyagonal tüy çizgileri — düz gradyanı gerçek bir kanada
  // biraz daha yaklaştırır, hangi UV bölgesi örneklenirse örneklensin
  // desen tutarlı kaldığı için hizalama riski yok.
  if (type === 'wings') {
    ctx.lineWidth = 1
    ctx.globalAlpha = 0.22
    ctx.strokeStyle = '#000000'
    for (let i = -32; i < 64; i += 5) {
      ctx.beginPath()
      ctx.moveTo(i, 0)
      ctx.lineTo(i + 32, 32)
      ctx.stroke()
    }
    ctx.globalAlpha = 0.26
    ctx.strokeStyle = '#ffffff'
    for (let i = -30; i < 64; i += 5) {
      ctx.beginPath()
      ctx.moveTo(i + 2, 0)
      ctx.lineTo(i + 34, 32)
      ctx.stroke()
    }
    ctx.globalAlpha = 1
  }

  return canvas.toDataURL()
}
