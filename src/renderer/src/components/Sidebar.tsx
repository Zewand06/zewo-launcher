import { HomeIcon, ModsIcon, SettingsIcon, ProfileIcon, AdminIcon, LogoutIcon } from './icons'
import Logo from './Logo'

export type Screen = 'home' | 'mods' | 'settings' | 'profile' | 'admin'

interface SidebarProps {
  active: Screen
  showAdmin: boolean
  onNavigate: (screen: Screen) => void
  onLogout: () => void
}

const BASE_ITEMS: { id: Screen; label: string; Icon: typeof HomeIcon }[] = [
  { id: 'home', label: 'Ana Sayfa', Icon: HomeIcon },
  { id: 'mods', label: 'Modlar', Icon: ModsIcon },
  { id: 'settings', label: 'Ayarlar', Icon: SettingsIcon },
  { id: 'profile', label: 'Profil', Icon: ProfileIcon }
]

export default function Sidebar({
  active,
  showAdmin,
  onNavigate,
  onLogout
}: SidebarProps): JSX.Element {
  const items = showAdmin
    ? [...BASE_ITEMS, { id: 'admin' as Screen, label: 'Admin', Icon: AdminIcon }]
    : BASE_ITEMS

  return (
    <nav className="rail">
      <div className="rail-brand">
        <Logo size={30} />
      </div>

      <div className="rail-items">
        {items.map((item) => {
          const Icon = item.Icon
          return (
            <button
              key={item.id}
              type="button"
              title={item.label}
              className={active === item.id ? 'rail-btn active' : 'rail-btn'}
              onClick={() => onNavigate(item.id)}
            >
              <Icon size={22} />
              <span>{item.label}</span>
            </button>
          )
        })}
      </div>

      <button type="button" className="rail-btn logout" title="Çıkış Yap" onClick={onLogout}>
        <LogoutIcon size={22} />
        <span>Çıkış</span>
      </button>
    </nav>
  )
}
