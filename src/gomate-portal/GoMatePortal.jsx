import { useCallback, useEffect, useState } from 'react';
import './gomate-portal.css';

const roleLabels = {
  business: 'Business',
  staff: 'Staff',
  admin: 'Admin',
};

const demoUsers = {
  business: { email: 'business@gomate.app', password: 'business123', name: 'Luma Social Club' },
  staff: { email: 'staff@gomate.app', password: 'staff123', name: 'Alex Morgan' },
  admin: { email: 'admin@gomate.app', password: 'admin123', name: 'Jordan Lee' },
};

const portalStorageKey = 'gomate-portal.mock-state.v1';

const initialBusinessApplications = [
  { id: 'seed-moss-morning', company: 'Moss & Morning', category: 'Local retail', taxId: '0318842201', address: '42 Nguyen Hue, District 1, Ho Chi Minh City', contact: '+84 90 123 4567', email: 'hello@mossmorning.vn', status: 'pending', submittedAt: '12 min ago', userEmail: null },
  { id: 'seed-harbor-pilates', company: 'Harbor Pilates', category: 'Wellness studio', taxId: '0317748820', address: '18 Tran Phu, Hai Chau, Da Nang', contact: '+84 91 234 5678', email: 'team@harborpilates.vn', status: 'pending', submittedAt: '1 hr ago', userEmail: null },
];

function createInitialPortalState() {
  const accounts = Object.fromEntries(Object.entries(demoUsers).map(([role, account]) => [account.email, {
    id: `${role}-001`, role, ...account, isApproved: role !== 'business', businessProfile: null,
  }]));
  return { accounts, applications: initialBusinessApplications, sessionEmail: null };
}

function loadPortalState() {
  if (typeof window === 'undefined') return createInitialPortalState();
  try {
    const saved = JSON.parse(window.localStorage.getItem(portalStorageKey) || 'null');
    if (!saved || typeof saved !== 'object') return createInitialPortalState();
    const initial = createInitialPortalState();
    return {
      accounts: { ...initial.accounts, ...(saved.accounts || {}) },
      applications: Array.isArray(saved.applications) ? saved.applications : initial.applications,
      sessionEmail: typeof saved.sessionEmail === 'string' ? saved.sessionEmail : null,
    };
  } catch {
    return createInitialPortalState();
  }
}

function getSessionUser(account) {
  if (!account) return null;
  return {
    id: account.id, role: account.role, name: account.name, email: account.email,
    isApproved: account.isApproved, businessProfile: account.businessProfile || null,
  };
}

const routeForRole = (role) => `/${role}`;

function usePortalRouter() {
  const initialPath = typeof window === 'undefined' ? '/login' : window.location.pathname;
  const [path, setPath] = useState(initialPath.startsWith('/') ? initialPath : '/login');

  useEffect(() => {
    const onPopState = () => setPath(window.location.pathname || '/login');
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const navigate = useCallback((nextPath) => {
    if (typeof window === 'undefined') return;
    window.history.pushState({}, '', nextPath);
    setPath(nextPath);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return { path, navigate };
}

function mockLogin({ email, password, role }, accounts = createInitialPortalState().accounts) {
  return new Promise((resolve, reject) => {
    window.setTimeout(() => {
      const normalizedEmail = String(email || '').trim().toLowerCase();
      const account = Object.values(accounts).find((candidate) => candidate.email.toLowerCase() === normalizedEmail && candidate.role === role);
      if (!account || account.password !== password) {
        reject(new Error(`The email or password is not valid for the ${roleLabels[role]?.toLowerCase() || 'selected'} workspace.`));
        return;
      }
      resolve(getSessionUser(account));
    }, 450);
  });
}

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
              <div className="gm-visual-caption"><strong>2,840</strong><span>people connected today</span></div>
            </div>
            <div className="gm-visual-card gm-visual-card--floating"><span className="gm-floating-icon"><Icon name="activity" size={15} /></span><span><strong>+28%</strong><small>engagement this week</small></span></div>
          </div>
          <div className="gm-auth-footer"><span>Trusted by communities in 18 cities</span><span className="gm-auth-avatars"><Avatar initials="AS" tone="blue" size="xs" /><Avatar initials="MV" tone="pink" size="xs" /><Avatar initials="+" tone="white" size="xs" /></span></div>
        </div>
      </aside>
      <main className="gm-auth-main">{children}</main>
    </div>
  );
}

function LoginPage({ onLogin, onRegister, accounts }) {
  const [role, setRole] = useState('business');
  const [email, setEmail] = useState(demoUsers.business.email);
  const [password, setPassword] = useState(demoUsers.business.password);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [language, setLanguage] = useState('en');
  const [error, setError] = useState('');
  const [registrationError, setRegistrationError] = useState('');
  const [registrationSubmitted, setRegistrationSubmitted] = useState(false);
  const [registrationForm, setRegistrationForm] = useState({
    name: '',
    email: '',
    password: '',
    website: '',
    category: 'Community & events',
    terms: false,
  });

  const copy = language === 'vi' ? {
    signInEyebrow: 'Chào mừng trở lại',
    signInTitle: 'Đăng nhập GoMate',
    signInText: 'Chọn không gian làm việc để tiếp tục.',
    email: 'Địa chỉ email',
    password: 'Mật khẩu',
    keepSignedIn: 'Duy trì đăng nhập',
    forgot: 'Quên mật khẩu?',
    continueAs: 'Tiếp tục với',
    signingIn: 'Đang đăng nhập...',
    orContinue: 'hoặc tiếp tục với',
    createAccount: 'Tạo tài khoản',
    demoHint: 'Demo: thông tin đăng nhập được điền sẵn theo vai trò.',
    createEyebrow: 'Đăng ký GoMate',
    createTitle: 'Tạo không gian của bạn',
    createText: 'Hoàn tất thông tin để bắt đầu kết nối với cộng đồng.',
    fullName: 'Tên hiển thị',
    businessName: 'Tên doanh nghiệp',
    workEmail: 'Email làm việc',
    website: 'Website',
    category: 'Danh mục',
    registrationPassword: 'Tạo mật khẩu',
    agree: 'Tôi đồng ý với điều khoản và chính sách bảo mật của GoMate.',
    submitRegistration: 'Gửi đăng ký',
    backToSignIn: 'Quay lại đăng nhập',
    applicationReceived: 'Đã tiếp nhận đăng ký',
    applicationText: 'Chúng tôi sẽ xem xét thông tin và liên hệ với bạn sớm.',
    registrationError: 'Vui lòng đồng ý với điều khoản để tiếp tục.',
    brandEyebrow: 'Không gian kết nối cho cộng đồng',
    brandTitle: 'Đưa mọi người đến gần nhau hơn.',
    brandText: 'GoMate giúp mọi cộng đồng chia sẻ, hỗ trợ và phát triển cùng nhau.',
    trusted: 'Được tin dùng tại 18 thành phố',
  } : {
    signInEyebrow: 'Welcome back',
    signInTitle: 'Sign in to GoMate',
    signInText: 'Choose your workspace to continue.',
    email: 'Email address',
    password: 'Password',
    keepSignedIn: 'Keep me signed in',
    forgot: 'Forgot password?',
    continueAs: 'Continue as',
    signingIn: 'Signing in...',
    orContinue: 'or continue with',
    createAccount: 'Create account',
    demoHint: 'Demo: credentials are prefilled for the selected role.',
    createEyebrow: 'Join GoMate',
    createTitle: 'Create your space',
    createText: 'Set up your account and start building meaningful connections.',
    fullName: 'Full name',
    businessName: 'Business name',
    workEmail: 'Work email',
    website: 'Website',
    category: 'Category',
    registrationPassword: 'Create a password',
    agree: 'I agree to the GoMate terms and privacy policy.',
    submitRegistration: 'Submit registration',
    backToSignIn: 'Back to sign in',
    applicationReceived: 'Registration received',
    applicationText: 'We will review your details and contact you shortly.',
    registrationError: 'Please agree to the terms to continue.',
    brandEyebrow: 'The social home for your community',
    brandTitle: 'Bring your people closer.',
    brandText: 'GoMate gives every community a warmer way to share, support, and grow together.',
    trusted: 'Trusted by communities in 18 cities',
  };

  const selectRole = (nextRole) => {
    setRole(nextRole);
    setEmail(demoUsers[nextRole].email);
    setPassword(demoUsers[nextRole].password);
    setError('');
    if (nextRole === 'admin') {
      setIsSignUp(false);
      setRegistrationSubmitted(false);
    }
  };

  const updateRegistrationField = (field) => (event) => {
    const value = field === 'terms' ? event.target.checked : event.target.value;
    setRegistrationForm((current) => ({ ...current, [field]: value }));
  };

  const openSignUp = () => {
    if (role === 'admin') return;
    setError('');
    setRegistrationError('');
    setRegistrationSubmitted(false);
    setIsSignUp(true);
  };

  const returnToSignIn = () => {
    setIsSignUp(false);
    setRegistrationError('');
    setRegistrationSubmitted(false);
  };

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const user = await mockLogin({ email, password, role }, accounts);
      onLogin(user);
    } catch (loginError) {
      setError(loginError.message);
    } finally {
      setIsLoading(false);
    }
  };

  const submitRegistration = async (event) => {
    event.preventDefault();
    if (!['business', 'staff'].includes(role)) {
      setRegistrationError('Admin accounts are configured by GoMate and cannot be created here.');
      return;
    }
    if (!registrationForm.terms) {
      setRegistrationError(copy.registrationError);
      return;
    }
    setRegistrationError('');
    setIsRegistering(true);
    try {
      await onRegister({ ...registrationForm, role, email: registrationForm.email.trim().toLowerCase() });
      setRegistrationSubmitted(true);
    } catch (registerError) {
      setRegistrationError(registerError.message || 'Unable to create this account.');
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className={`gm-auth-stage relative min-h-screen overflow-hidden bg-slate-50 ${isSignUp ? 'is-signup' : ''}`}>
      <div className="gm-auth-language absolute right-6 top-6 z-30 inline-flex items-center rounded-full border border-slate-200 bg-white/90 p-1 shadow-sm backdrop-blur">
        {['en', 'vi'].map((option) => <button key={option} type="button" onClick={() => setLanguage(option)} aria-pressed={language === option} className={`rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] transition-colors ${language === option ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-900'}`}>{option}</button>)}
      </div>

      <section className={`gm-auth-brand-panel absolute inset-y-0 left-0 z-10 w-1/2 transform bg-[#191640] text-white transition-transform duration-700 ease-in-out ${isSignUp ? 'translate-x-full' : 'translate-x-0'}`} aria-label="GoMate brand panel">
        <div className="gm-auth-brand-content flex min-h-full flex-col px-8 py-9 lg:px-16 xl:px-20">
          <Logo />
          <div className="gm-auth-copy max-w-[420px] pt-[clamp(4rem,12vh,9rem)]">
            <span className="gm-eyebrow gm-eyebrow--light">{copy.brandEyebrow}</span>
            <h1 className="mt-4 max-w-[390px] font-['Space_Grotesk'] text-5xl font-semibold leading-[0.98] tracking-[-0.07em] lg:text-6xl">{copy.brandTitle}</h1>
            <p className="mt-6 max-w-[340px] text-base leading-7 text-white/65">{copy.brandText}</p>
          </div>
          <div className="gm-auth-brand-visual relative mt-auto mb-8 min-h-[230px] max-w-[440px]" aria-hidden="true">
            <div className="gm-auth-visual-orbit gm-auth-visual-orbit--one" />
            <div className="gm-auth-visual-orbit gm-auth-visual-orbit--two" />
            <div className="gm-auth-visual-card gm-auth-visual-card--main">
              <div className="gm-visual-topline flex items-center gap-2 text-[10px] font-semibold text-white/65"><span className="gm-visual-dot h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_12px_#67e8f9]" />Community pulse<Icon name="dots" size={14} /></div>
              <div className="gm-auth-visual-rings"><div className="gm-auth-ring gm-auth-ring--one"><Avatar initials="LM" tone="pink" size="sm" /></div><div className="gm-auth-ring gm-auth-ring--two"><Avatar initials="NT" tone="blue" size="sm" /></div><div className="gm-auth-ring gm-auth-ring--three"><Avatar initials="AR" tone="lime" size="sm" /></div><span className="gm-auth-ring-center"><Icon name="users" size={20} /></span></div>
              <div className="gm-visual-caption flex items-baseline gap-2 border-t border-white/10 pt-1 text-[10px] text-white/55"><strong className="font-['Space_Grotesk'] text-xl text-white">2,840</strong> people connected today</div>
            </div>
            <div className="gm-auth-visual-card gm-auth-visual-card--floating"><span className="gm-floating-icon flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600"><Icon name="activity" size={15} /></span><span><strong className="block text-[13px]">+28%</strong><small className="mt-1 block text-[9px] text-white/55">engagement this week</small></span></div>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-white/45"><span>{copy.trusted}</span><span className="inline-flex pl-1"><Avatar initials="AS" tone="blue" size="xs" /><Avatar initials="MV" tone="pink" size="xs" /><Avatar initials="+" tone="white" size="xs" /></span></div>
        </div>
      </section>

      <section className={`gm-auth-form-panel absolute inset-y-0 right-0 z-20 w-1/2 transform overflow-y-auto bg-[#fbfcff] transition-transform duration-700 ease-in-out ${isSignUp ? '-translate-x-full' : 'translate-x-0'}`} aria-label={isSignUp ? 'Create a GoMate account' : 'Sign in to GoMate'}>
        <div className="mx-auto flex min-h-full w-full max-w-[480px] items-center px-8 py-20 lg:px-12">
          <div className="w-full py-5">
            <div className="gm-auth-mobile-logo"><Logo /></div>

            {!isSignUp ? <>
              <div className="gm-auth-heading"><span className="gm-eyebrow">{copy.signInEyebrow}</span><h2>{copy.signInTitle}</h2><p>{copy.signInText}</p></div>
              <div className="gm-role-switcher" role="tablist" aria-label="Account role">
                {Object.entries(roleLabels).map(([key, label]) => <button key={key} type="button" className={role === key ? 'is-active' : ''} onClick={() => selectRole(key)} role="tab" aria-selected={role === key}>{label}</button>)}
              </div>
              <form className="gm-auth-form" onSubmit={submit}>
                <label className="gm-field"><span>{copy.email}</span><div className="gm-input-wrap"><Icon name="users" size={17} /><input value={email} onChange={(event) => setEmail(event.target.value)} type="email" autoComplete="email" required /></div></label>
                <label className="gm-field"><span>{copy.password}</span><div className="gm-input-wrap"><Icon name="shield" size={17} /><input value={password} onChange={(event) => setPassword(event.target.value)} type={showPassword ? 'text' : 'password'} autoComplete="current-password" required /><button type="button" className="gm-input-action" onClick={() => setShowPassword((value) => !value)}>{showPassword ? 'Hide' : 'Show'}</button></div></label>
                <div className="gm-form-meta"><label className="gm-checkbox"><input type="checkbox" defaultChecked /><span>{copy.keepSignedIn}</span></label><button type="button" className="gm-link-button">{copy.forgot}</button></div>
                {error && <div className="gm-form-error" role="alert"><Icon name="close" size={14} />{error}</div>}
                <PillButton type="submit" icon="arrow" disabled={isLoading} className="gm-btn--wide">{isLoading ? copy.signingIn : `${copy.continueAs} ${roleLabels[role]}`}</PillButton>
              </form>
              <div className="gm-divider"><span>{copy.orContinue}</span></div>
              <div className="gm-social-row"><button type="button" className="gm-social-btn"><span className="gm-social-g">G</span>Google</button><button type="button" className="gm-social-btn"><span className="gm-social-apple">A</span>Apple</button></div>
              {role !== 'admin' && <button type="button" onClick={openSignUp} className="gm-create-account-button mt-4 flex w-full items-center justify-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm font-medium text-indigo-600 transition-colors hover:border-indigo-200 hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:ring-offset-2">{copy.createAccount}<Icon name="arrow" size={16} /></button>}
              <p className="gm-demo-hint">{copy.demoHint}</p>
            </> : <>
              <button type="button" className="gm-back-link" onClick={returnToSignIn}><Icon name="arrow" size={15} /> {copy.backToSignIn}</button>
              <div className="gm-auth-heading"><span className="gm-eyebrow">{copy.createEyebrow}</span><h2>{copy.createTitle}</h2><p>{copy.createText}</p></div>
              {registrationSubmitted ? <div className="gm-success-state"><span className="gm-success-icon"><Icon name="check" size={24} /></span><h3>{copy.applicationReceived}</h3><p>{copy.applicationText}</p><button type="button" className="gm-link-button mt-5" onClick={returnToSignIn}>{copy.backToSignIn}</button></div> : <form className="gm-auth-form" onSubmit={submitRegistration}>
                <label className="gm-field"><span>{role === 'business' ? copy.businessName : copy.fullName}</span><div className="gm-input-wrap"><Icon name={role === 'business' ? 'grid' : 'users'} size={17} /><input value={registrationForm.name} onChange={updateRegistrationField('name')} placeholder={role === 'business' ? 'e.g. Luma Social Club' : 'e.g. Alex Morgan'} required /></div></label>
                <label className="gm-field"><span>{copy.workEmail}</span><div className="gm-input-wrap"><Icon name="users" size={17} /><input value={registrationForm.email} onChange={updateRegistrationField('email')} type="email" placeholder="you@business.com" required /></div></label>
                {role === 'business' && <div className="gm-field-grid"><label className="gm-field"><span>{copy.category}</span><div className="gm-input-wrap"><Icon name="activity" size={17} /><select value={registrationForm.category} onChange={updateRegistrationField('category')}><option>Community & events</option><option>Retail & lifestyle</option><option>Food & hospitality</option><option>Education</option></select></div></label><label className="gm-field"><span>{copy.website}</span><div className="gm-input-wrap"><Icon name="external" size={17} /><input value={registrationForm.website} onChange={updateRegistrationField('website')} type="url" placeholder="https://" /></div></label></div>}
                <label className="gm-field"><span>{copy.registrationPassword}</span><div className="gm-input-wrap"><Icon name="shield" size={17} /><input value={registrationForm.password} onChange={updateRegistrationField('password')} type="password" autoComplete="new-password" minLength={8} required /></div></label>
                <label className="gm-checkbox gm-checkbox--terms"><input type="checkbox" checked={registrationForm.terms} onChange={updateRegistrationField('terms')} /><span>{copy.agree}</span></label>
                {registrationError && <div className="gm-form-error" role="alert"><Icon name="close" size={14} />{registrationError}</div>}
                <PillButton type="submit" icon="arrow" disabled={isRegistering} className="gm-btn--wide">{isRegistering ? 'Creating account...' : copy.submitRegistration}</PillButton>
              </form>}
            </>}
          </div>
        </div>
      </section>
    </div>
  );
}

function RegistrationPage({ onBack, onComplete }) {
  const [role, setRole] = useState('business');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', email: '', password: '', website: '', category: 'Community & events' });
  const updateField = (field) => (event) => setForm((value) => ({ ...value, [field]: event.target.value }));
  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await onComplete({ ...form, role, email: form.email.trim().toLowerCase() });
    } catch (registrationError) {
      setError(registrationError.message || 'Unable to create this account.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell asideTitle="Find your place in the GoMate community." asideText="Create a staff or business account and get started in the right workspace.">
      <div className="gm-auth-panel gm-register-panel">
        <div className="gm-auth-mobile-logo"><Logo /></div>
        <button type="button" className="gm-back-link" onClick={onBack}><Icon name="arrow" size={15} /> Back to sign in</button>
        <div className="gm-auth-heading"><span className="gm-eyebrow">Join GoMate</span><h2>Create your account</h2><p>Choose an account type. Admin access is configured separately.</p></div>
        <form className="gm-auth-form" onSubmit={submit}>
          <label className="gm-field"><span>Account type</span><div className="gm-input-wrap"><Icon name={role === 'business' ? 'grid' : 'users'} size={17} /><select value={role} onChange={(event) => setRole(event.target.value)}><option value="business">Business</option><option value="staff">Staff</option></select></div></label>
          {role === 'business' && <label className="gm-field"><span>Business name</span><div className="gm-input-wrap"><Icon name="grid" size={17} /><input value={form.name} onChange={updateField('name')} placeholder="e.g. Luma Social Club" required /></div></label>}
          {role === 'staff' && <label className="gm-field"><span>Full name</span><div className="gm-input-wrap"><Icon name="users" size={17} /><input value={form.name} onChange={updateField('name')} placeholder="e.g. Alex Morgan" required /></div></label>}
          <label className="gm-field"><span>Email</span><div className="gm-input-wrap"><Icon name="users" size={17} /><input value={form.email} onChange={updateField('email')} type="email" autoComplete="email" required /></div></label>
          {role === 'business' && <div className="gm-field-grid"><label className="gm-field"><span>Category</span><div className="gm-input-wrap"><Icon name="activity" size={17} /><select value={form.category} onChange={updateField('category')}><option>Community & events</option><option>Retail & lifestyle</option><option>Food & hospitality</option><option>Education</option></select></div></label><label className="gm-field"><span>Website <em>Optional</em></span><div className="gm-input-wrap"><Icon name="external" size={17} /><input value={form.website} onChange={updateField('website')} type="url" placeholder="https://" /></div></label></div>}
          <label className="gm-field"><span>Password</span><div className="gm-input-wrap"><Icon name="shield" size={17} /><input value={form.password} onChange={updateField('password')} type="password" autoComplete="new-password" minLength={8} required /></div></label>
          <label className="gm-checkbox gm-checkbox--terms"><input type="checkbox" required /><span>I agree to the GoMate terms and privacy policy.</span></label>
          {error && <div className="gm-form-error" role="alert"><Icon name="close" size={14} />{error}</div>}
          <PillButton type="submit" icon="arrow" disabled={submitting} className="gm-btn--wide">{submitting ? 'Creating account...' : 'Create account'}</PillButton>
        </form>
        <p className="gm-auth-switch">Already have an account? <button type="button" className="gm-link-button" onClick={onBack}>Sign in</button></p>
      </div>
    </AuthShell>
  );
}

function Sidebar({ role, active, onNavigate, onLogout }) {
  const items = role === 'business' ? [['overview', 'Overview', 'grid'], ['studio', 'Post studio', 'edit'], ['activity', 'Activity', 'activity'], ['billing', 'Billing', 'wallet']] : role === 'staff' ? [['overview', 'Overview', 'grid'], ['moderation', 'Moderation queue', 'shield'], ['reports', 'Reports', 'users'], ['tickets', 'Support tickets', 'life']] : [['overview', 'Overview', 'grid'], ['users', 'Users & subscriptions', 'users'], ['businesses', 'Businesses', 'shield'], ['settings', 'Settings', 'wallet']];
  return <aside className="gm-sidebar"><div className="gm-sidebar-brand"><Logo compact /></div><div className="gm-sidebar-role"><span className={`gm-role-dot gm-role-dot--${role}`} />{roleLabels[role]} workspace</div><nav className="gm-sidebar-nav">{items.map(([key, label, icon]) => <button key={key} type="button" className={`gm-nav-item ${active === key ? 'is-active' : ''}`} onClick={() => onNavigate(key)}><Icon name={icon} size={18} /><span>{label}</span>{key === 'moderation' && <span className="gm-nav-count">6</span>}{key === 'reports' && <span className="gm-nav-count gm-nav-count--muted">3</span>}</button>)}</nav><div className="gm-sidebar-bottom"><div className="gm-sidebar-tip"><span className="gm-tip-icon"><Icon name="life" size={15} /></span><strong>Need a hand?</strong><span>Visit the help center</span><button type="button" className="gm-sidebar-tip-link">Open help <Icon name="arrow" size={13} /></button></div><button type="button" className="gm-nav-item gm-nav-item--logout" onClick={onLogout}><Icon name="logout" size={18} /><span>Sign out</span></button></div></aside>;
}

function Topbar({ role, title, onMobileMenu }) {
  return <header className="gm-topbar"><div className="gm-topbar-left"><button type="button" className="gm-mobile-menu" onClick={onMobileMenu}><Icon name="grid" size={18} /></button><div><span className="gm-topbar-kicker">{roleLabels[role]} workspace</span><h1>{title}</h1></div></div><div className="gm-topbar-actions"><button type="button" className="gm-icon-btn gm-search-btn"><Icon name="search" size={18} /><span>Search</span><kbd>Ctrl K</kbd></button><button type="button" className="gm-icon-btn gm-bell-btn"><Icon name="bell" size={18} /><span className="gm-notification-dot" /></button><span className="gm-topbar-divider" /><Avatar initials={role === 'business' ? 'LS' : role === 'staff' ? 'AM' : 'JL'} tone={role === 'business' ? 'purple' : role === 'staff' ? 'blue' : 'orange'} /><span className="gm-user-name">{role === 'business' ? 'Luma Social Club' : role === 'staff' ? 'Alex Morgan' : 'Jordan Lee'}</span><Icon name="dots" size={17} /></div></header>;
}

function DashboardShell({ role, active, title, subtitle, onNavigate, onLogout, children }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [currentActive, setCurrentActive] = useState(active);
  const handleNavigate = (nextSection) => {
    setCurrentActive(nextSection);
    setMenuOpen(false);
    onNavigate(nextSection);
    if (nextSection === 'studio' && typeof document !== 'undefined') {
      document.querySelector('.gm-composer-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };
  return (
    <div className={`gm-dashboard ${menuOpen ? 'gm-dashboard--menu-open' : ''}`}>
      <Sidebar role={role} active={currentActive} onNavigate={handleNavigate} onLogout={onLogout} />
      <div className="gm-main">
        <Topbar role={role} title={title} onMobileMenu={() => setMenuOpen((value) => !value)} />
        <div className="gm-page-content">
          <div className="gm-page-intro">
            <div><span className="gm-eyebrow">{role === 'business' ? 'Tuesday, October 15, 2026' : 'Workspace overview'}</span><h2>{title}</h2><p>{subtitle}</p></div>
            <div className="gm-page-actions">{role === 'business' && <PillButton icon="plus" onClick={() => handleNavigate('studio')}>Create a post</PillButton>}{role === 'staff' && <PillButton variant="secondary" icon="search" onClick={() => handleNavigate('moderation')}>Review queue</PillButton>}{role === 'admin' && <PillButton icon="external" onClick={() => handleNavigate('users')}>Export report</PillButton>}</div>
          </div>
          {children}
          {role === 'business' && <CommunityChat />}
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, change, helper, icon, tone = 'purple' }) {
  return <article className="gm-metric-card"><div className={`gm-metric-icon gm-metric-icon--${tone}`}><Icon name={icon} size={18} /></div><div className="gm-metric-label">{label}<span className="gm-metric-info">i</span></div><strong className="gm-metric-value">{value}</strong><div className="gm-metric-foot"><span className={`gm-change ${change?.startsWith('-') ? 'gm-change--down' : ''}`}>{change}</span><span>{helper}</span></div></article>;
}

const initialBusinessPosts = [
  { id: 1, title: 'Friday night, but make it social', excerpt: 'Join us for an intimate rooftop session with live vinyl, local bites, and the best views in town.', status: 'Approved', date: 'Oct 11, 2026', reach: '12.8k', tone: 'green', accent: 'purple' },
  { id: 2, title: 'Your midweek reset starts here', excerpt: 'Bring a friend and take 20% off every wellness pass this Wednesday.', status: 'Pending', date: 'Oct 14, 2026', reach: 'Reviewing', tone: 'orange', accent: 'mint' },
  { id: 3, title: 'A little thank you to our members', excerpt: 'A private early-access drop is waiting inside the Luma community.', status: 'Rejected', date: 'Oct 08, 2026', reach: 'Needs edit', tone: 'red', accent: 'rose' },
];

function BusinessPendingState({ application, onLogout }) {
  const rejected = application?.status === 'rejected';
  return <main className="min-h-screen bg-slate-50 px-5 py-8 sm:px-10">
    <header className="mx-auto flex max-w-5xl items-center justify-between"><Logo /><button type="button" onClick={onLogout} className="text-sm font-semibold text-indigo-600 hover:text-indigo-800">Sign out</button></header>
    <section className="mx-auto mt-16 max-w-xl rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${rejected ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'}`}>{rejected ? 'Changes requested' : 'Pending review'}</span>
      <h1 className="mt-5 text-2xl font-semibold text-slate-900">{rejected ? 'Your application needs an update' : 'Your business application is under review'}</h1>
      <p className="mt-3 text-sm leading-6 text-slate-600">{rejected ? (application.reviewNote || 'Please contact GoMate support for help updating your application.') : 'Your registration details were submitted. Business tools will unlock after Admin approval.'}</p>
      {application?.company && <p className="mt-5 border-t border-slate-100 pt-4 text-sm font-medium text-slate-800">{application.company}</p>}
    </section>
  </main>;
}

function CommunityChat() {
  const [messages, setMessages] = useState([
    { id: 1, initials: 'NT', name: 'Nhi Tran', time: '10:24 AM', text: 'Anyone joining the Saturday neighborhood walk?' },
    { id: 2, initials: 'MK', name: 'Minh Khoa', time: '10:27 AM', text: 'Count me in. I can bring a few friends from the club.' },
    { id: 3, initials: 'LS', name: 'Luma Social Club', time: '10:31 AM', text: 'We will share the route and meeting point this afternoon.' },
  ]);
  const [draft, setDraft] = useState('');
  const sendMessage = (event) => {
    event.preventDefault();
    if (!draft.trim()) return;
    setMessages((current) => [...current, { id: Date.now(), initials: 'LS', name: 'Luma Social Club', time: 'Just now', text: draft.trim() }]);
    setDraft('');
  };
  return <section className="gm-panel gm-community-chat"><div className="gm-panel-heading"><div><span className="gm-eyebrow">Community</span><h3>Chat cộng đồng</h3></div><StatusPill tone="green">12 online</StatusPill></div><div className="gm-chat-messages" aria-live="polite">{messages.map((message) => <article className="gm-chat-message" key={message.id}><Avatar initials={message.initials} tone={message.initials === 'LS' ? 'purple' : 'blue'} size="sm" /><div><div className="gm-chat-message-meta"><strong>{message.name}</strong><span>{message.time}</span></div><p>{message.text}</p></div></article>)}</div><form className="gm-chat-compose" onSubmit={sendMessage}><input aria-label="Message community chat" value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Write a message to your community..." /><PillButton type="submit" icon="arrow">Send</PillButton></form></section>;
}

function BusinessDashboard({ onNavigate, onLogout, user, applications = [] }) {
  const [posts, setPosts] = useState(initialBusinessPosts);
  const [draft, setDraft] = useState({ title: '', copy: '', badge: 'Member favorite', discount: '20% off', premium: true, border: 'Glow' });
  const [toast, setToast] = useState('');

  const publishPost = (event) => {
    event.preventDefault();
    if (!draft.title.trim() || !draft.copy.trim()) return;
    setPosts((current) => [{ id: Date.now(), title: draft.title, excerpt: draft.copy, status: 'Pending', date: 'Just now', reach: 'Reviewing', tone: 'orange', accent: draft.border === 'Glow' ? 'purple' : 'mint' }, ...current]);
    setDraft((value) => ({ ...value, title: '', copy: '' }));
    setToast('Your post is in the moderation queue.');
    window.setTimeout(() => setToast(''), 3200);
  };

  const application = applications.find((item) => item.userEmail === user.email);
  if (!user.isApproved) return <BusinessPendingState application={application || user.businessProfile} onLogout={onLogout} />;

  return <DashboardShell role="business" active="overview" title="Good morning, Luma" subtitle="Here is how your GoMate community is moving today." onNavigate={onNavigate} onLogout={onLogout}><div className="gm-metric-grid"><MetricCard label="Total posts" value="48" change="+12.5%" helper="vs. last month" icon="edit" tone="purple" /><MetricCard label="Participants" value="8,420" change="+18.2%" helper="active this month" icon="users" tone="blue" /><MetricCard label="Engagement" value="72.8%" change="+6.4%" helper="average rate" icon="activity" tone="mint" /><MetricCard label="GoMate Plus" value="$1,240" change="+22.1%" helper="revenue this month" icon="wallet" tone="orange" /></div><div className="gm-business-grid"><section className="gm-panel gm-composer-panel"><div className="gm-panel-heading"><div><span className="gm-eyebrow">Post studio</span><h3>Create a post</h3></div><span className="gm-live-pill"><span />Live preview</span></div><form className="gm-composer-form" onSubmit={publishPost}><label className="gm-field"><span>Post title</span><input className="gm-simple-input" value={draft.title} onChange={(event) => setDraft((value) => ({ ...value, title: event.target.value }))} placeholder="Give your post a clear, inviting title" /></label><label className="gm-field"><span>Your message</span><textarea className="gm-simple-input gm-textarea" value={draft.copy} onChange={(event) => setDraft((value) => ({ ...value, copy: event.target.value }))} placeholder="What would you like to share with your community?" rows={4} /></label><div className="gm-composer-options"><label className="gm-field gm-field--small"><span>Badge</span><select className="gm-simple-input" value={draft.badge} onChange={(event) => setDraft((value) => ({ ...value, badge: event.target.value }))}><option>Member favorite</option><option>New</option><option>Limited</option><option>Community pick</option></select></label><label className="gm-field gm-field--small"><span>Discount tag</span><select className="gm-simple-input" value={draft.discount} onChange={(event) => setDraft((value) => ({ ...value, discount: event.target.value }))}><option>20% off</option><option>15% off</option><option>Free entry</option><option>None</option></select></label><label className="gm-field gm-field--small"><span>Border</span><select className="gm-simple-input" value={draft.border} onChange={(event) => setDraft((value) => ({ ...value, border: event.target.value }))}><option>Glow</option><option>Soft</option><option>Solid</option></select></label></div><div className="gm-premium-toggle"><span className="gm-premium-spark"><Icon name="activity" size={15} /></span><span><strong>Premium styling</strong><small>Badge, custom border, and discount tag</small></span><button type="button" className={`gm-toggle ${draft.premium ? 'is-on' : ''}`} aria-pressed={draft.premium} onClick={() => setDraft((value) => ({ ...value, premium: !value.premium }))}><span /></button></div><PillButton type="submit" icon="arrow" className="gm-btn--wide">Send for approval</PillButton></form></section><section className="gm-panel gm-preview-panel"><div className="gm-panel-heading"><div><span className="gm-eyebrow">Preview</span><h3>How it will look</h3></div><button type="button" className="gm-icon-btn"><Icon name="dots" size={17} /></button></div><div className={`gm-preview-card gm-preview-card--${draft.border.toLowerCase()}`}><div className="gm-preview-top"><span className="gm-preview-badge"><Icon name="activity" size={12} />{draft.premium ? draft.badge : 'Community update'}</span><span className="gm-preview-menu"><Icon name="dots" size={16} /></span></div><div className="gm-preview-art"><span className="gm-preview-art-orbit orbit-a" /><span className="gm-preview-art-orbit orbit-b" /><span className="gm-preview-art-center"><Icon name="users" size={28} /></span><span className="gm-preview-discount">{draft.premium ? draft.discount : 'GoMate'}</span></div><div className="gm-preview-copy"><h4>{draft.title || 'Your post title appears here'}</h4><p>{draft.copy || 'Add a thoughtful message to make your community feel invited.'}</p></div><div className="gm-preview-footer"><span><Avatar initials="LS" tone="purple" size="xs" />Luma Social Club</span><span>Just now</span></div></div><div className="gm-preview-note"><Icon name="shield" size={15} /><span>Premium posts get a visual boost in the discovery feed.</span></div></section></div><section className="gm-panel gm-posts-panel"><div className="gm-panel-heading"><div><span className="gm-eyebrow">Content library</span><h3>Recent posts</h3></div><button type="button" className="gm-text-action" onClick={() => onNavigate('studio')}>View all <Icon name="arrow" size={14} /></button></div><div className="gm-table-wrap"><table className="gm-table"><thead><tr><th>Post</th><th>Status</th><th>Published</th><th>Reach</th><th /></tr></thead><tbody>{posts.map((post) => <tr key={post.id}><td><div className="gm-post-cell"><span className={`gm-post-thumb gm-post-thumb--${post.accent}`}><Icon name="activity" size={15} /></span><span><strong>{post.title}</strong><small>{post.excerpt}</small></span></div></td><td><StatusPill tone={post.tone}>{post.status}</StatusPill></td><td>{post.date}</td><td>{post.reach}</td><td><button type="button" className="gm-icon-btn"><Icon name="dots" size={17} /></button></td></tr>)}</tbody></table></div></section>{toast && <div className="gm-toast"><span><Icon name="check" size={16} /></span>{toast}</div>}</DashboardShell>;
}

const moderationPosts = [
  { id: 11, title: 'Sunday market, reimagined', business: 'Moss & Morning', category: 'Local retail', submitted: '12 min ago', initials: 'MM', tone: 'mint', content: 'A slower Sunday for good finds, good food, and even better company.' },
  { id: 12, title: 'Open mic under the stars', business: 'The Lantern Room', category: 'Events', submitted: '29 min ago', initials: 'LR', tone: 'purple', content: 'Bring your story, your song, or simply a friend. Every voice belongs here.' },
  { id: 13, title: 'A little more room to breathe', business: 'Kindred Wellness', category: 'Wellness', submitted: '1 hr ago', initials: 'KW', tone: 'blue', content: 'New restorative sessions are now open for booking in our community space.' },
];

function StaffDashboard({ onNavigate, onLogout }) {
  const [queue, setQueue] = useState(moderationPosts);
  const [decision, setDecision] = useState({});
  const [reportActions, setReportActions] = useState({});
  const [selectedTicket, setSelectedTicket] = useState(0);
  const [reply, setReply] = useState('');
  const reports = [{ name: 'Taylor Kim', handle: '@taylork', reason: 'Repeated promotional posts', time: '8 min ago', initials: 'TK', tone: 'pink' }, { name: 'Sam Rivera', handle: '@sam.r', reason: 'Harassing replies', time: '42 min ago', initials: 'SR', tone: 'orange' }, { name: 'Morgan Ellis', handle: '@morgan.e', reason: 'Suspicious links', time: '2 hr ago', initials: 'ME', tone: 'blue' }];
  const tickets = [{ subject: 'Verification document question', person: 'Moss & Morning', type: 'Business', time: '9 min ago', initials: 'MM', tone: 'mint', message: 'Hi Alex, we uploaded our updated registration document. Could you confirm it came through?' }, { subject: 'Can I edit a live post?', person: 'Jamie Wu', type: 'Member', time: '31 min ago', initials: 'JW', tone: 'purple', message: 'I noticed a typo in my event post. What is the best way to update it?' }, { subject: 'Report follow-up', person: 'Nia Carter', type: 'Member', time: '1 hr ago', initials: 'NC', tone: 'pink', message: 'I sent a report yesterday and wanted to share one more detail with the support team.' }];
  const decide = (id, value) => { setDecision((current) => ({ ...current, [id]: value })); window.setTimeout(() => setQueue((current) => current.filter((post) => post.id !== id)), 450); };
  const doReportAction = (index, action) => setReportActions((current) => ({ ...current, [index]: action }));
  const sendReply = () => { if (!reply.trim()) return; setReply(''); };

  return <DashboardShell role="staff" active="overview" title="Support center" subtitle="Keep the GoMate community thoughtful, safe, and moving forward." onNavigate={onNavigate} onLogout={onLogout}><div className="gm-metric-grid gm-metric-grid--staff"><MetricCard label="In moderation" value={queue.length} change="6 new" helper="need review" icon="shield" tone="purple" /><MetricCard label="Open reports" value="14" change="-18.4%" helper="vs. last week" icon="users" tone="orange" /><MetricCard label="Open tickets" value="23" change="+4.2%" helper="today" icon="life" tone="blue" /><MetricCard label="Avg. first reply" value="18m" change="-12m" helper="this week" icon="activity" tone="mint" /></div><div className="gm-staff-grid"><section className="gm-panel gm-moderation-panel"><div className="gm-panel-heading"><div><span className="gm-eyebrow">Needs your attention</span><h3>Moderation queue <span className="gm-heading-count">{queue.length}</span></h3></div><button type="button" className="gm-text-action">View all <Icon name="arrow" size={14} /></button></div>{queue.length === 0 ? <div className="gm-empty-state"><span><Icon name="check" size={22} /></span><h4>Queue is clear</h4><p>Nice work. New posts will appear here when they need a review.</p></div> : <div className="gm-moderation-list">{queue.map((post) => <article className="gm-moderation-item" key={post.id}><Avatar initials={post.initials} tone={post.tone} /><div className="gm-moderation-copy"><div className="gm-moderation-meta"><strong>{post.business}</strong><span>{post.category}</span><span>{post.submitted}</span></div><h4>{post.title}</h4><p>{post.content}</p><div className="gm-moderation-actions">{decision[post.id] ? <StatusPill tone={decision[post.id] === 'Approved' ? 'green' : 'red'}>{decision[post.id]}</StatusPill> : <><button type="button" className="gm-btn gm-btn--tiny gm-btn--approve" onClick={() => decide(post.id, 'Approved')}><Icon name="check" size={14} />Approve</button><button type="button" className="gm-btn gm-btn--tiny gm-btn--reject" onClick={() => decide(post.id, 'Rejected')}><Icon name="close" size={14} />Reject</button></>}</div></div><button type="button" className="gm-icon-btn"><Icon name="dots" size={17} /></button></article>)}</div>}</section><section className="gm-panel gm-reports-panel"><div className="gm-panel-heading"><div><span className="gm-eyebrow">Safety desk</span><h3>Recent reports</h3></div><button type="button" className="gm-icon-btn"><Icon name="dots" size={17} /></button></div><div className="gm-report-list">{reports.map((report, index) => <article className="gm-report-item" key={report.handle}><Avatar initials={report.initials} tone={report.tone} size="sm" /><div className="gm-report-copy"><strong>{report.name}</strong><span>{report.handle} / {report.time}</span><p>{report.reason}</p></div>{reportActions[index] ? <StatusPill tone={reportActions[index] === 'Blocked' ? 'red' : 'orange'}>{reportActions[index]}</StatusPill> : <div className="gm-report-actions"><button type="button" className="gm-report-btn gm-report-btn--warn" onClick={() => doReportAction(index, 'Warned')}>Warn</button><button type="button" className="gm-report-btn gm-report-btn--block" onClick={() => doReportAction(index, 'Blocked')}>Block</button></div>}</article>)}</div><button type="button" className="gm-panel-link">Open report center <Icon name="arrow" size={14} /></button></section></div><section className="gm-panel gm-tickets-panel"><div className="gm-panel-heading"><div><span className="gm-eyebrow">Keep conversations warm</span><h3>Support tickets</h3></div><StatusPill tone="purple">23 open</StatusPill></div><div className="gm-ticket-layout"><div className="gm-ticket-list">{tickets.map((ticket, index) => <button type="button" className={`gm-ticket-item ${selectedTicket === index ? 'is-selected' : ''}`} key={ticket.subject} onClick={() => setSelectedTicket(index)}><Avatar initials={ticket.initials} tone={ticket.tone} size="sm" /><span><strong>{ticket.subject}</strong><small>{ticket.person} / {ticket.time}</small></span><Icon name="arrow" size={14} /></button>)}</div><div className="gm-ticket-detail"><div className="gm-ticket-detail-head"><div><span className="gm-eyebrow">{tickets[selectedTicket].type} request</span><h4>{tickets[selectedTicket].subject}</h4></div><span className="gm-ticket-priority">Normal priority</span></div><div className="gm-ticket-message"><Avatar initials={tickets[selectedTicket].initials} tone={tickets[selectedTicket].tone} size="sm" /><div><strong>{tickets[selectedTicket].person}</strong><span>{tickets[selectedTicket].time}</span><p>{tickets[selectedTicket].message}</p></div></div><div className="gm-reply-box"><textarea value={reply} onChange={(event) => setReply(event.target.value)} placeholder="Write a helpful reply..." rows={3} /><div className="gm-reply-actions"><span>Press Enter to send</span><PillButton icon="arrow" onClick={sendReply}>Send reply</PillButton></div></div></div></div></section></DashboardShell>;
}

const users = [{ initials: 'TK', name: 'Taylor Kim', email: 'taylor.kim@email.com', joined: 'Oct 12, 2026', plan: 'GoMate Plus', status: 'Active', tone: 'pink' }, { initials: 'DO', name: 'Diego Ortega', email: 'diego.o@email.com', joined: 'Oct 10, 2026', plan: 'Free', status: 'Active', tone: 'blue' }, { initials: 'AS', name: 'Avery Singh', email: 'avery.s@email.com', joined: 'Oct 09, 2026', plan: 'GoMate Plus', status: 'Active', tone: 'mint' }, { initials: 'MJ', name: 'Maya Jones', email: 'maya.j@email.com', joined: 'Oct 08, 2026', plan: 'GoMate Plus', status: 'Paused', tone: 'orange' }];

function AdminDashboard({ onNavigate, onLogout, applications, onDecideBusiness }) {
  const [selectedUser, setSelectedUser] = useState(null);
  const [reviewNotes, setReviewNotes] = useState({});
  const businesses = applications.filter((application) => application.status === 'pending');
  const initials = (name) => name.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase();

  return <DashboardShell role="admin" active="overview" title="Good morning, Jordan" subtitle="A clear view of GoMate health, growth, and trust." onNavigate={onNavigate} onLogout={onLogout}>
    <div className="gm-metric-grid gm-metric-grid--admin"><MetricCard label="Active users" value="128,420" change="+8.6%" helper="this month" icon="users" tone="purple" /><MetricCard label="Verified businesses" value="2,846" change="+14.2%" helper="all time" icon="shield" tone="mint" /><MetricCard label="Pending applications" value={businesses.length} change="Needs review" helper="business verification" icon="grid" tone="orange" /><MetricCard label="Trust score" value="96.8%" change="+1.8%" helper="community health" icon="activity" tone="blue" /></div>
    <div className="gm-admin-overview-grid">
      <section className="gm-panel gm-revenue-panel"><div className="gm-panel-heading"><div><span className="gm-eyebrow">Performance</span><h3>Revenue overview</h3></div><select className="gm-period-select" defaultValue="30"><option value="30">Last 30 days</option><option value="90">Last 90 days</option></select></div><div className="gm-revenue-summary"><div><strong>$84,320</strong><span><em>+21.4%</em> vs. previous period</span></div><div className="gm-legend"><span><i className="gm-legend-dot gm-legend-dot--primary" />GoMate Plus</span><span><i className="gm-legend-dot gm-legend-dot--soft" />Promoted posts</span></div></div><div className="gm-chart"><div className="gm-chart-y"><span>$100k</span><span>$75k</span><span>$50k</span><span>$25k</span><span>$0</span></div><div className="gm-chart-area"><div className="gm-chart-gridlines"><i /><i /><i /><i /><i /></div><div className="gm-chart-bars">{[52, 58, 50, 64, 71, 66, 76, 72, 80, 86, 82, 93].map((height, index) => <div className="gm-chart-bar-group" key={index}><span className="gm-chart-bar gm-chart-bar--primary" style={{ height: `${height}%` }} /><span className="gm-chart-bar gm-chart-bar--soft" style={{ height: `${Math.max(height - 27, 12)}%` }} /><small>{['Sep 19', '', 'Sep 25', '', 'Oct 1', '', 'Oct 7', '', 'Oct 11', '', 'Oct 14', ''][index]}</small></div>)}</div></div></div></section>
      <section className="gm-panel gm-business-review-panel"><div className="gm-panel-heading"><div><span className="gm-eyebrow">Trust & safety</span><h3>Pending business registrations</h3></div><span className="gm-review-count">{businesses.length} waiting</span></div>
        {businesses.length === 0 ? <div className="gm-empty-state gm-empty-state--small"><span><Icon name="check" size={22} /></span><h4>Nothing waiting</h4><p>New business applications will appear here.</p></div> : <div className="gm-business-review-list">{businesses.map((business) => <article className="gm-business-application" key={business.id}><div className="gm-business-application-heading"><Avatar initials={initials(business.company)} tone="mint" size="sm" /><div><strong>{business.company}</strong><span>{business.category} · {business.submittedAt}</span></div></div><dl className="gm-business-application-details"><div><dt>Tax ID</dt><dd>{business.taxId}</dd></div><div><dt>Address</dt><dd>{business.address}</dd></div><div><dt>Contact</dt><dd>{business.contact}</dd></div><div><dt>Account email</dt><dd>{business.email}</dd></div></dl>{business.userEmail && <label className="gm-field"><span>Review note</span><input className="gm-simple-input" value={reviewNotes[business.id] || ''} onChange={(event) => setReviewNotes((current) => ({ ...current, [business.id]: event.target.value }))} placeholder="Optional note for the business" /></label>}<div className="gm-business-review-actions"><PillButton icon="check" onClick={() => onDecideBusiness(business.id, 'approved')}>Approve</PillButton><PillButton icon="close" variant="secondary" onClick={() => onDecideBusiness(business.id, 'rejected', reviewNotes[business.id] || '')}>Reject</PillButton></div></article>)}</div>}
      </section>
    </div>
    <section className="gm-panel gm-users-panel"><div className="gm-panel-heading"><div><span className="gm-eyebrow">People & plans</span><h3>User and subscription management</h3></div><div className="gm-table-actions"><label className="gm-table-search"><Icon name="search" size={15} /><input placeholder="Search users" /></label><button type="button" className="gm-icon-btn"><Icon name="dots" size={17} /></button></div></div><div className="gm-table-wrap"><table className="gm-table gm-users-table"><thead><tr><th>User</th><th>Joined</th><th>Plan</th><th>Status</th><th /></tr></thead><tbody>{users.map((user) => <tr key={user.email}><td><div className="gm-post-cell"><Avatar initials={user.initials} tone={user.tone} size="sm" /><span><strong>{user.name}</strong><small>{user.email}</small></span></div></td><td>{user.joined}</td><td><span className={`gm-plan ${user.plan === 'GoMate Plus' ? 'gm-plan--plus' : ''}`}>{user.plan === 'GoMate Plus' && <Icon name="activity" size={12} />}{user.plan}</span></td><td><StatusPill tone={user.status === 'Active' ? 'green' : 'orange'}>{user.status}</StatusPill></td><td><button type="button" className="gm-icon-btn" onClick={() => setSelectedUser(user)} aria-label={`Open ${user.name} profile`}><Icon name="dots" size={17} /></button></td></tr>)}</tbody></table></div></section>
    {selectedUser && <div className="gm-modal-backdrop" onClick={() => setSelectedUser(null)}><div className="gm-user-modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}><div className="gm-modal-head"><div><span className="gm-eyebrow">User profile</span><h3>{selectedUser.name}</h3></div><button type="button" className="gm-icon-btn" onClick={() => setSelectedUser(null)}><Icon name="close" size={17} /></button></div><div className="gm-modal-user"><Avatar initials={selectedUser.initials} tone={selectedUser.tone} size="lg" /><div><strong>{selectedUser.email}</strong><span>Joined {selectedUser.joined}</span></div></div><div className="gm-modal-stats"><div><span>Plan</span><strong>{selectedUser.plan}</strong></div><div><span>Status</span><strong>{selectedUser.status}</strong></div><div><span>Reports</span><strong>0</strong></div></div><PillButton variant="secondary" className="gm-btn--wide" onClick={() => setSelectedUser(null)}>Close profile</PillButton></div></div>}
  </DashboardShell>;
}

export function GoMatePortal() {
  const { path, navigate } = usePortalRouter();
  const [portalState, setPortalState] = useState(loadPortalState);
  const user = portalState.sessionEmail ? getSessionUser(portalState.accounts[portalState.sessionEmail]) : null;
  const routeRole = path.replace('/', '').split('/')[0];
  const role = ['business', 'staff', 'admin'].includes(routeRole) ? routeRole : null;

  useEffect(() => {
    if (typeof window !== 'undefined') window.localStorage.setItem(portalStorageKey, JSON.stringify(portalState));
  }, [portalState]);

  const logout = () => {
    setPortalState((current) => ({ ...current, sessionEmail: null }));
    navigate('/login');
  };
  const handleLogin = (nextUser) => {
    setPortalState((current) => ({ ...current, sessionEmail: nextUser.email }));
    navigate(routeForRole(nextUser.role));
  };
  const handleRegister = async (details) => {
    const nextRole = details.role;
    const email = String(details.email || '').trim().toLowerCase();
    if (!['business', 'staff'].includes(nextRole)) throw new Error('Admin accounts are configured by GoMate and cannot be created here.');
    if (!email || !details.password || !details.name?.trim()) throw new Error('Complete all required account fields.');
    if (portalState.accounts[email]) throw new Error('An account with this email already exists.');
    const account = { id: `user-${Date.now()}`, role: nextRole, name: details.name.trim(), email, password: details.password, isApproved: nextRole === 'staff', businessProfile: nextRole === 'business' ? { website: details.website || '', category: details.category || 'Community & events' } : null };
    setPortalState((current) => ({ ...current, accounts: { ...current.accounts, [email]: account }, sessionEmail: email }));
    navigate(routeForRole(nextRole));
  };
  const decideBusiness = (id, status, reviewNote = '') => {
    setPortalState((current) => {
      const application = current.applications.find((item) => item.id === id);
      if (!application || application.status !== 'pending') return current;
      const accounts = application.userEmail ? {
        ...current.accounts,
        [application.userEmail]: {
          ...current.accounts[application.userEmail],
          isApproved: status === 'approved',
          businessProfile: { ...application, status, reviewNote },
        },
      } : current.accounts;
      return { ...current, accounts, applications: current.applications.map((item) => item.id === id ? { ...item, status, reviewNote } : item) };
    });
  };

  useEffect(() => {
    if (role && (!user || user.role !== role)) navigate('/login');
    else if (user && !role && (path === '/login' || path === '/')) navigate(routeForRole(user.role));
  }, [navigate, path, role, user]);

  if (path === '/register') return <div className="gomate-portal"><RegistrationPage onBack={() => navigate('/login')} onComplete={handleRegister} /></div>;
  if (role && (!user || user.role !== role)) return <div className="gomate-portal"><LoginPage onLogin={handleLogin} onRegister={handleRegister} accounts={portalState.accounts} /></div>;
  if (path === '/staff') return <div className="gomate-portal"><StaffDashboard onNavigate={() => {}} onLogout={logout} /></div>;
  if (path === '/admin') return <div className="gomate-portal"><AdminDashboard onNavigate={() => {}} onLogout={logout} applications={portalState.applications} onDecideBusiness={decideBusiness} /></div>;
  if (path === '/business') return <div className="gomate-portal"><BusinessDashboard onNavigate={() => {}} onLogout={logout} user={user} applications={portalState.applications} /></div>;
  return <div className="gomate-portal"><LoginPage onLogin={handleLogin} onRegister={handleRegister} accounts={portalState.accounts} /></div>;
}

export { LoginPage, RegistrationPage, BusinessDashboard, StaffDashboard, AdminDashboard, mockLogin, Logo, Icon, AuthShell, PillButton, StatusPill, MetricCard };
export default GoMatePortal;
