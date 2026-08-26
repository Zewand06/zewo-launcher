interface LogoProps {
  size?: number
}

export default function Logo({ size = 28 }: LogoProps): JSX.Element {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" role="img" aria-label="Zewo">
      <defs>
        <linearGradient id="zewo-mark-grad" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="var(--cyan)" />
          <stop offset="1" stopColor="var(--violet)" />
        </linearGradient>
      </defs>
      <rect x="0.5" y="0.5" width="23" height="23" rx="6.5" fill="url(#zewo-mark-grad)" />
      <path
        d="M6.4,7 H17.6 V9.5 L10.7,14.5 H17.6 V17 H6.4 V14.5 L13.3,9.5 H6.4 Z"
        fill="var(--void)"
      />
    </svg>
  )
}
