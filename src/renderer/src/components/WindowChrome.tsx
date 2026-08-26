import Logo from './Logo'

export default function WindowChrome(): JSX.Element {
  return (
    <div className="chrome">
      <div className="app-id">
        <Logo size={15} />
        Zewo Launcher
      </div>
      <div className="win-btns">
        <button aria-label="Küçült" onClick={() => window.zewo.window.minimize()}>
          &#x2212;
        </button>
        <button aria-label="Büyüt / geri al" onClick={() => window.zewo.window.toggleMaximize()}>
          &#x25A1;
        </button>
        <button aria-label="Kapat" className="close" onClick={() => window.zewo.window.close()}>
          &#x2715;
        </button>
      </div>
    </div>
  )
}
