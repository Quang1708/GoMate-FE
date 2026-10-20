import './gomate-portal.css';

function Icon({ name, size = 18, strokeWidth = 1.8 }) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': 'true',
  };

  const paths = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
    edit: <><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4Z" /></>,
    activity: <><path d="M3 12h4l2-7 4 14 2-7h6" /></>,
    wallet: <><path d="M3 7h16a2 2 0 0 1 2 2v9H5a2 2 0 0 1-2-2Z" /><path d="M3 7V5a2 2 0 0 1 2-2h13" /><path d="M16 13h.01" /></>,
    users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>,
    shield: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" /><path d="m9 12 2 2 4-4" /></>,
    life: <><circle cx="12" cy="12" r="9" /><path d="M9.1 9a3 3 0 1 1 5.8 1c-.4 1.5-2.9 1.5-2.9 3" /><path d="M12 17h.01" /></>,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></>,
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    arrow: <><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></>,
    plus: <><path d="M12 5v14M5 12h14" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    close: <><path d="m6 6 12 12M18 6 6 18" /></>,
    upload: <><path d="M12 16V4" /><path d="m7 9 5-5 5 5" /><path d="M5 20h14" /></>,
    dots: <><circle cx="5" cy="12" r="1" fill="currentColor" stroke="none" /><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" /><circle cx="19" cy="12" r="1" fill="currentColor" stroke="none" /></>,
    logout: <><path d="M10 17l5-5-5-5" /><path d="M15 12H3" /><path d="M21 19V5a2 2 0 0 0-2-2h-6" /></>,
    external: <><path d="M14 3h7v7" /><path d="M10 14 21 3" /><path d="M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5" /></>,
  };

  return <svg {...common}>{paths[name] || paths.grid}</svg>;
}

function Logo({ compact = false }) {
  return (
    <div className={`gm-logo ${compact ? 'gm-logo--compact' : ''}`}>
      <span className="gm-logo-mark">
        <svg viewBox="0 0 42 42" role="img" aria-label="GoMate logo">
          <defs>
            <linearGradient id="gmLogoGradient" x1="5" y1="5" x2="37" y2="37" gradientUnits="userSpaceOnUse">
              <stop stopColor="#6b4eff" />
              <stop offset="1" stopColor="#28d7e8" />
            </linearGradient>
          </defs>
          <path d="M21 35.3S6.8 26.8 6.8 16.8C6.8 11.8 10.3 8 15 8c2.7 0 4.8 1.4 6 3.4C22.2 9.4 24.3 8 27 8c4.7 0 8.2 3.8 8.2 8.8C35.2 26.8 21 35.3 21 35.3Z" fill="url(#gmLogoGradient)" />
          <path d="m12.6 20.1 5.2-1.2 3.4-5.2 1.6 5.2 5.1 1.2-5.1 1.2-1.6 5.2-3.4-5.2-5.2-1.2Z" fill="white" opacity=".95" />
        </svg>
      </span>
      <span className="gm-logo-text">GoMate</span>
    </div>
  );
}

function PillButton({ children, variant = 'primary', icon, type = 'button', onClick, disabled = false, className = '' }) {
  return (
    <button type={type} className={`gm-btn gm-btn--${variant} ${className}`} onClick={onClick} disabled={disabled}>
      {icon && <Icon name={icon} size={16} />}
      <span>{children}</span>
    </button>
  );
}

function StatusPill({ children, tone = 'neutral' }) {
  return <span className={`gm-status gm-status--${tone}`}><span className="gm-status-dot" />{children}</span>;
}

function Avatar({ initials, tone = 'purple', size = 'md' }) {
  return <span className={`gm-avatar gm-avatar--${tone} gm-avatar--${size}`}>{initials}</span>;
}

function AuthShell({ children, asideTitle, asideText }) {
  return (
    <div className="gm-auth-page">
      <aside className="gm-auth-aside">
        <div className="gm-auth-aside-inner">
          <Logo />
          <div className="gm-auth-copy">
            <span className="gm-eyebrow gm-eyebrow--light">The social home for your community</span>
            <h1>{asideTitle}</h1>
            <p>{asideText}</p>
          </div>
          <div className="gm-auth-visual" aria-hidden="true">
            <div className="gm-orbit gm-orbit--one" />
            <div className="gm-orbit gm-orbit--two" />
            <div className="gm-visual-card gm-visual-card--main">
              <div className="gm-visual-topline"><span className="gm-visual-dot" /><span>Community pulse</span><span className="gm-visual-menu"><Icon name="dots" size={14} /></span></div>
              <div className="gm-visual-rings"><div className="gm-ring gm-ring--one"><Avatar initials="LM" tone="pink" size="sm" /></div><div className="gm-ring gm-ring--two"><Avatar initials="NT" tone="blue" size="sm" /></div><div className="gm-ring gm-ring--three"><Avatar initials="AR" tone="lime" size="sm" /></div><div className="gm-ring gm-ring--four"><Avatar initials="SK" tone="orange" size="sm" /></div><span className="gm-ring-center"><Icon name="users" size={20} /></span></div>
              <div className="gm-visual-caption"><strong>GoMate</strong><span>Kết nối cộng đồng</span></div>
            </div>
            <div className="gm-visual-card gm-visual-card--floating"><span className="gm-floating-icon"><Icon name="activity" size={15} /></span><span><strong>Sự kiện</strong><small>Trải nghiệm cùng nhau</small></span></div>
          </div>
          <div className="gm-auth-footer"><span>Không gian dành cho đối tác GoMate</span></div>
        </div>
      </aside>
      <main className="gm-auth-main">{children}</main>
    </div>
  );
}

function MetricCard({ label, value, change, helper, icon, tone = 'purple' }) {
  return <article className="gm-metric-card"><div className={`gm-metric-icon gm-metric-icon--${tone}`}><Icon name={icon} size={18} /></div><div className="gm-metric-label">{label}<span className="gm-metric-info">i</span></div><strong className="gm-metric-value">{value}</strong><div className="gm-metric-foot"><span className={`gm-change ${change?.startsWith('-') ? 'gm-change--down' : ''}`}>{change}</span><span>{helper}</span></div></article>;
}

export { Logo, Icon, AuthShell, PillButton, StatusPill, MetricCard };
