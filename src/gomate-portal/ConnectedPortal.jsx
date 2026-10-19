import { useCallback, useEffect, useState } from 'react';
import { api, apiBaseUrl, getSession, logout } from '../services/api';
import { Logo, Icon, AuthShell, PillButton, StatusPill, MetricCard, BusinessDashboard, StaffDashboard, AdminDashboard } from './GoMatePortal';
import './connected-portal.css';

const statusLabel = { pending: 'Chờ duyệt', approved: 'Đã duyệt', rejected: 'Từ chối', publishing: 'Đang xuất bản' };
const tone = status => status === 'approved' ? 'green' : status === 'rejected' ? 'red' : 'orange';
const format = iso => iso ? new Date(iso).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', dateStyle: 'short', timeStyle: 'short' }) : '—';
const fieldStyle = 'gm-simple-input';
function Field({ label, children }) { return <label className="gm-field"><span>{label}</span>{children}</label>; }
const mockAccounts = [
  { email: 'admin@gomate.app', password: 'admin123', role: 'admin', name: 'Jordan Lee' },
  { email: 'staff@gomate.app', password: 'staff123', role: 'staff', name: 'Alex Morgan' },
  { email: 'partner@gomate.app', password: 'partner123', role: 'business', name: 'GoMate Partner' },
];

const initialMockBusinessApplications = [
  { id: 'mock-application-1', company: 'Harbor Pilates', category: 'Wellness studio', taxId: '0317748820', address: '18 Tran Phu, Da Nang', contact: '+84 91 234 5678', email: 'team@harborpilates.vn', userEmail: null, status: 'pending', submittedAt: '1 hr ago', reviewNote: '' },
  { id: 'mock-application-2', company: 'Moss & Morning', category: 'Local retail', taxId: '0318842201', address: '42 Nguyen Hue, Ho Chi Minh City', contact: '+84 90 123 4567', email: 'hello@mossmorning.vn', userEmail: null, status: 'pending', submittedAt: '12 min ago', reviewNote: '' },
];

function PortalLoginPage({ onLogin, onRegister, accounts = mockAccounts }) {
  const [authMode, setAuthMode] = useState('login');
  const [form, setForm] = useState({ fullName: '', email: '', password: '', company: '', taxId: '', address: '', contact: '' });
  const [documentFile, setDocumentFile] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const isLogin = authMode === 'login';
  const updateField = key => event => setForm(current => ({ ...current, [key]: event.target.value }));
  const returnToLogin = () => { setError(''); setAuthMode('login'); };

  const handleSubmit = async event => {
    event.preventDefault();
    setError('');
    if (isLogin) {
      const normalizedEmail = form.email.trim().toLowerCase();
      const account = accounts.find(item => item.email.toLowerCase() === normalizedEmail && item.password === form.password);
      if (!account) { setError('Sai email hoặc mật khẩu'); return; }
      onLogin(account);
      return;
    }

    if (authMode === 'registerPartner' && !documentFile) {
      setError('Vui lòng tải lên giấy tờ xác minh doanh nghiệp.');
      return;
    }
    setBusy(true);
    try {
      await onRegister({
        ...form,
        email: form.email.trim().toLowerCase(),
        role: authMode === 'registerStaff' ? 'staff' : 'business',
        name: authMode === 'registerStaff' ? form.fullName.trim() : form.company.trim(),
        documentFile,
      });
    } catch (registrationError) {
      setError(registrationError.message || 'Không thể tạo tài khoản.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="gomate-portal gm-connected">
      <AuthShell
        asideTitle="Kết nối doanh nghiệp với cộng đồng."
        asideText="Tạo sự kiện, chia sẻ ưu đãi và cùng GoMate mang đến những trải nghiệm đáng nhớ."
      >
        <div className="gm-auth-panel">
          <div className="gm-auth-brand-mark"><Logo /></div>
          {isLogin ? (
            <>
              <div className="gm-auth-heading">
                <span className="gm-eyebrow">GOMATE PARTNERS</span>
                <h2>Log In</h2>
                <p>Dùng tài khoản GoMate của bạn để tiếp tục.</p>
              </div>
              <form className="gm-auth-form" onSubmit={handleSubmit}>
                <label className="gm-field">
                  <span>Email</span>
                  <div className="gm-input-wrap">
                    <Icon name="users" size={17} />
                    <input type="email" autoComplete="username" required value={form.email} onChange={updateField('email')} aria-invalid={Boolean(error)} />
                  </div>
                </label>
                <label className="gm-field">
                  <span>Mật khẩu</span>
                  <div className="gm-input-wrap">
                    <Icon name="shield" size={17} />
                    <input type="password" autoComplete="current-password" required value={form.password} onChange={updateField('password')} aria-invalid={Boolean(error)} />
                  </div>
                </label>
                {error && <div role="alert" className="gm-form-error">{error}</div>}
                <PillButton type="submit" className="gm-btn--wide">Đăng nhập</PillButton>
              </form>
              <div className="gm-live-links gm-registration-links">
                <button type="button" onClick={() => { setError(''); setAuthMode('registerStaff'); }}>Đăng kí Staff</button>
                <button type="button" onClick={() => { setError(''); setAuthMode('registerPartner'); }}>Đăng kí GoMate Partner</button>
              </div>
            </>
          ) : (
            <>
              <button type="button" onClick={returnToLogin} className="gm-back-link"><Icon name="arrow" size={15} />Quay lại đăng nhập</button>
              <div className="gm-auth-heading">
                <span className="gm-eyebrow">GoMate registration</span>
                <h2>{authMode === 'registerStaff' ? 'Đăng ký Staff' : 'Đăng ký GoMate Partner'}</h2>
                <p>{authMode === 'registerStaff' ? 'Tạo tài khoản để hỗ trợ cộng đồng GoMate.' : 'Gửi thông tin doanh nghiệp để Admin xác minh.'}</p>
              </div>
              <form className="gm-auth-form" onSubmit={handleSubmit}>
                {authMode === 'registerStaff' ? (
                  <>
                    <label className="gm-field"><span>Họ và tên</span><div className="gm-input-wrap"><Icon name="users" size={17} /><input value={form.fullName} onChange={updateField('fullName')} autoComplete="name" required /></div></label>
                    <label className="gm-field"><span>Email</span><div className="gm-input-wrap"><Icon name="users" size={17} /><input type="email" autoComplete="email" value={form.email} onChange={updateField('email')} required /></div></label>
                    <label className="gm-field"><span>Mật khẩu</span><div className="gm-input-wrap"><Icon name="shield" size={17} /><input type="password" autoComplete="new-password" minLength={8} value={form.password} onChange={updateField('password')} required /></div></label>
                  </>
                ) : (
                  <>
                    <label className="gm-field"><span>Email</span><div className="gm-input-wrap"><Icon name="users" size={17} /><input type="email" autoComplete="email" value={form.email} onChange={updateField('email')} required /></div></label>
                    <label className="gm-field"><span>Mật khẩu</span><div className="gm-input-wrap"><Icon name="shield" size={17} /><input type="password" autoComplete="new-password" minLength={8} value={form.password} onChange={updateField('password')} required /></div></label>
                    <label className="gm-field"><span>Tên công ty</span><div className="gm-input-wrap"><Icon name="grid" size={17} /><input value={form.company} onChange={updateField('company')} autoComplete="organization" required /></div></label>
                    <label className="gm-field"><span>Mã số thuế (Tax ID)</span><div className="gm-input-wrap"><Icon name="shield" size={17} /><input value={form.taxId} onChange={updateField('taxId')} required /></div></label>
                    <label className="gm-field"><span>Địa chỉ</span><div className="gm-input-wrap"><Icon name="external" size={17} /><textarea className="gm-textarea" value={form.address} onChange={updateField('address')} autoComplete="street-address" rows={3} required /></div></label>
                    <label className="gm-field"><span>Thông tin liên hệ</span><div className="gm-input-wrap"><Icon name="users" size={17} /><input value={form.contact} onChange={updateField('contact')} autoComplete="tel" required /></div></label>
                    <label className="gm-upload-field"><span>Giấy tờ xác minh</span><input type="file" accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg" onChange={event => setDocumentFile(event.target.files?.[0] || null)} /><span className="gm-upload-box"><span className="gm-upload-icon"><Icon name="upload" size={18} /></span><strong>{documentFile?.name || 'Chọn tệp PDF, PNG hoặc JPG'}</strong><small>PDF, JPG hoặc PNG</small></span></label>
                  </>
                )}
                {error && <div role="alert" className="gm-form-error">{error}</div>}
                <PillButton type="submit" disabled={busy} className="gm-btn--wide">{busy ? 'Đang gửi...' : authMode === 'registerStaff' ? 'Đăng ký' : 'Gửi yêu cầu đăng ký'}</PillButton>
              </form>
            </>
          )}
        </div>
      </AuthShell>
    </div>
  );
}

async function pages(path) {
  const items = [];
  for (let page = 1; page <= 500; page++) { const result = await api(path + '?page=' + page); items.push(...result.items); if (items.length >= result.total || !result.items.length) return { items }; }
  throw Error('Danh sách quá lớn. Vui lòng liên hệ quản trị viên.');
}
async function fileValue(file) {
  if (!file || file.size > 10 * 1024 * 1024) throw Error('Chọn hồ sơ PDF/PNG/JPEG tối đa 10 MB.');
  return new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve({ name: file.name, mime: file.type, base64: String(reader.result).split(',')[1] }); reader.onerror = () => reject(Error('Không đọc được hồ sơ')); reader.readAsDataURL(file); });
}
const emptyDraft = () => {
  const local = new Date(Date.now() + 2 * 86400000 + 7 * 3600000).toISOString().slice(0, 10);
  return { title: '', copy: '', category: 'Workshop', location: 'TP. Hồ Chí Minh', meetingPoint: '', startsAt: local + 'T09:00', endsAt: local + 'T11:00', maxParticipants: 12, estimatedCost: 100000, discountPercent: 20, offer: '', offerTerms: '' };
};

export default function ConnectedPortal() {
  const [me, setMe] = useState(null), [data, setData] = useState({ posts: [], applications: [], users: [], metrics: {} });
  const [section, setSection] = useState('overview'), [busy, setBusy] = useState(false), [error, setError] = useState(''), [success, setSuccess] = useState('');
  const [mockMode, setMockMode] = useState(false);
  const [mockPortalState, setMockPortalState] = useState({
    accounts: { 'partner@gomate.app': { isApproved: true, businessProfile: { company: 'GoMate Partner', category: 'Community & events' } } },
    applications: initialMockBusinessApplications,
  });
  const [application, setApplication] = useState({ company: '', category: 'Workshop', website: '' }), [document, setDocument] = useState(null), [notes, setNotes] = useState({});
  const [draft, setDraft] = useState(emptyDraft);
  const load = useCallback(async () => {
    if (mockMode) return;
    if (!getSession()) { setMe(null); return; }
    const profile = await api('/portal/me'); setMe(profile);
    if (['business', 'staff', 'admin'].includes(profile.role)) {
      const [posts, metrics, applications, users] = await Promise.all([pages('/portal/posts'), api('/portal/metrics'), ['staff', 'admin'].includes(profile.role) ? pages('/portal/applications') : { items: [] }, profile.role === 'admin' ? pages('/portal/users') : { items: [] }]);
      setData({ posts: posts.items, applications: applications.items, users: users.items, metrics });
    }
  }, [mockMode]);
  useEffect(() => { let alive = true; void load().catch(reason => { if (alive) setError(reason.message); }); return () => { alive = false; }; }, [load]);
  const run = async action => { if (busy) return; setBusy(true); setError(''); setSuccess(''); try { await action(); } catch (reason) { setError(reason.message); } finally { setBusy(false); } };
  const handleMockLogin = account => {
    setMockMode(true);
    setError('');
    setSuccess('');
    setSection('overview');
    const businessState = mockPortalState.accounts[account.email] || { isApproved: false, businessProfile: null };
    setMe({ id: `mock-${account.role}`, role: account.role, name: account.name, email: account.email, isApproved: account.role === 'business' && businessState.isApproved, businessProfile: businessState.businessProfile, application: businessState.businessProfile });
  };
  const handleMockRegister = details => {
    const email = details.email.trim().toLowerCase();
    if (mockAccounts.some(account => account.email === email) || mockPortalState.accounts[email]) throw new Error('Email này đã được đăng ký.');
    const isBusiness = details.role === 'business';
    const businessProfile = isBusiness ? {
      company: details.company.trim(), taxId: details.taxId.trim(), address: details.address.trim(), contact: details.contact.trim(),
      documentName: details.documentFile?.name || '', category: 'Community & events',
    } : null;
    const applicationRecord = isBusiness ? {
      id: `mock-application-${Date.now()}`, ...businessProfile, email, userEmail: email, status: 'pending', submittedAt: 'Just now', reviewNote: '',
    } : null;
    const account = { id: `mock-${Date.now()}`, role: details.role, name: isBusiness ? businessProfile.company : details.fullName.trim(), email, password: details.password, isApproved: !isBusiness, businessProfile: applicationRecord || businessProfile };
    setMockPortalState(current => ({
      ...current,
      accounts: { ...current.accounts, [email]: account },
      applications: applicationRecord ? [...current.applications, applicationRecord] : current.applications,
    }));
    setMockMode(true);
    setSection('overview');
    setMe({ ...account, application: applicationRecord });
  };
  const decideMockBusiness = (id, status, reviewNote = '') => {
    setMockPortalState(current => {
      const applicationRecord = current.applications.find(item => item.id === id);
      if (!applicationRecord || applicationRecord.status !== 'pending') return current;
      const accounts = applicationRecord.userEmail ? {
        ...current.accounts,
        [applicationRecord.userEmail]: { ...current.accounts[applicationRecord.userEmail], isApproved: status === 'approved', businessProfile: { ...applicationRecord, status, reviewNote } },
      } : current.accounts;
      return { ...current, accounts, applications: current.applications.map(item => item.id === id ? { ...item, status, reviewNote } : item) };
    });
  };
  const logoutMock = () => {
    setMe(null);
    setMockMode(false);
    setData({ posts: [], applications: [], users: [], metrics: {} });
    setSection('overview');
  };
  const apply = event => { event.preventDefault(); void run(async () => { const uploaded = await fileValue(document); await api('/portal/applications', { method: 'POST', body: JSON.stringify({ ...application, document: uploaded }) }); await load(); setSuccess('Đã gửi hồ sơ. Staff sẽ kiểm tra trước khi bạn có thể đăng sự kiện.'); }); };
  const publish = event => {
    event.preventDefault();
    if (mockMode) {
      const post = { id: `mock-post-${Date.now()}`, title: draft.title, businessName: me.name, copy: draft.copy, status: 'pending', discountPercent: Number(draft.discountPercent), offer: draft.offer, offerTerms: draft.offerTerms };
      setData(current => ({ ...current, posts: [post, ...current.posts], metrics: { ...current.metrics, posts: current.metrics.posts + 1, pendingPosts: current.metrics.pendingPosts + 1 } }));
      setDraft(emptyDraft());
      setSuccess('Sự kiện demo đã được gửi cho staff duyệt.');
      return;
    }
    void run(async () => {
    await api('/portal/posts', { method: 'POST', body: JSON.stringify({ title: draft.title, copy: draft.copy, badge: 'Doanh nghiệp', discount: draft.discountPercent ? `Giảm ${draft.discountPercent}%` : '', premium: false, border: 'Solid', discountPercent: Number(draft.discountPercent), offer: draft.offer, offerTerms: draft.offerTerms, event: { category: draft.category, location: draft.location, meetingPoint: draft.meetingPoint, startsAt: new Date(draft.startsAt + ':00+07:00').toISOString(), endsAt: new Date(draft.endsAt + ':00+07:00').toISOString(), maxParticipants: Number(draft.maxParticipants), estimatedCost: Number(draft.estimatedCost), plan: ['Đón khách và xác nhận đăng ký', 'Trải nghiệm theo chương trình', 'Tổng kết và đánh giá'] } }) });
    await load(); setDraft(emptyDraft()); setSuccess('Đã gửi sự kiện cho staff. Sau khi được duyệt, bài sẽ xuất hiện trong app.');
    });
  };
  const decide = (kind, row, status) => {
    const reviewNote = notes[row.id] || '';
    if (status === 'rejected' && !reviewNote.trim()) { setError('Nhập lý do từ chối để doanh nghiệp có thể cập nhật.'); return; }
    if (mockMode) {
      const key = kind === 'applications' ? 'applications' : 'posts';
      setData(current => ({ ...current, [key]: current[key].map(item => item.id === row.id ? { ...item, status, reviewNote } : item) }));
      setSuccess(status === 'approved' ? 'Đã duyệt thành công.' : 'Đã gửi lý do từ chối.');
      return;
    }
    void run(async () => { await api(`/portal/${kind}/${row.id}`, { method: 'PATCH', body: JSON.stringify({ status, reviewNote }) }); await load(); setSuccess(status === 'approved' ? 'Đã duyệt thành công.' : 'Đã gửi lý do từ chối.'); });
  };
  const download = row => {
    if (mockMode) { setSuccess(`Hồ sơ demo của ${row.company} đã sẵn sàng.`); return; }
    void run(async () => { const response = await fetch(`${apiBaseUrl}/portal/applications/${row.id}/document`, { headers: { Authorization: 'Bearer ' + getSession().accessToken } }); if (!response.ok) throw Error('Không tải được hồ sơ'); const url = URL.createObjectURL(await response.blob()); const anchor = window.document.createElement('a'); anchor.href = url; anchor.download = 'ho-so-doanh-nghiep'; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); });
  };
  const patch = key => event => setDraft(value => ({ ...value, [key]: event.target.value }));
  const alerts = <>{error && <div role="alert" className="gm-form-error">{error}</div>}{success && <div role="status" className="gm-live-success"><Icon name="check" />{success}</div>}</>;
  if (mockMode && me) {
    const dashboard = me.role === 'admin'
      ? <AdminDashboard onNavigate={() => {}} onLogout={logoutMock} applications={mockPortalState.applications} onDecideBusiness={decideMockBusiness} />
      : me.role === 'staff'
        ? <StaffDashboard onNavigate={() => {}} onLogout={logoutMock} />
        : <BusinessDashboard onNavigate={() => {}} onLogout={logoutMock} user={me} applications={mockPortalState.applications} />;
    return <div className="gomate-portal gm-connected">{dashboard}</div>;
  }
  if (!me) {
    const registeredAccounts = Object.values(mockPortalState.accounts).filter(account => !mockAccounts.some(mockAccount => mockAccount.email === account.email));
    return <PortalLoginPage onLogin={handleMockLogin} onRegister={handleMockRegister} accounts={[...mockAccounts, ...registeredAccounts]} />;
  }
  const business = me.role === 'business', reviewing = ['staff', 'admin'].includes(me.role);
  const navigation = business ? [['overview', 'Tổng quan', 'grid'], ['studio', 'Tạo sự kiện', 'edit'], ['posts', 'Bài đăng của tôi', 'activity']] : reviewing ? [['overview', 'Tổng quan', 'grid'], ['businesses', 'Hồ sơ doanh nghiệp', 'shield'], ['posts', 'Duyệt bài đăng', 'edit'], ...(me.role === 'admin' ? [['users', 'Tài khoản', 'users']] : [])] : [['overview', 'Xác minh doanh nghiệp', 'shield']];
  return <div className="gomate-portal gm-connected"><div className="gm-dashboard"><aside className="gm-sidebar"><div className="gm-sidebar-brand"><Logo /></div><div className="gm-sidebar-role">{business ? 'Doanh nghiệp' : reviewing ? 'Kiểm duyệt GoMate' : 'Đăng ký đối tác'}</div><nav className="gm-sidebar-nav">{navigation.map(([id, label, icon]) => <button key={id} type="button" onClick={() => setSection(id)} className={`gm-nav-item ${section === id ? 'is-active' : ''}`}><Icon name={icon} />{label}</button>)}</nav><div className="gm-sidebar-bottom"><a href="/demo" className="gm-nav-item">Hướng dẫn demo</a><a href="/" className="gm-nav-item">Mở app GoMate ↗</a><button className="gm-nav-item" onClick={() => void run(async () => { await logout(); setMe(null); })}><Icon name="logout" />Đăng xuất</button></div></aside><main className="gm-main"><header className="gm-topbar"><Logo compact /><div><strong>{me.application?.company || me.name}</strong><p className="gm-live-muted">{business ? 'Doanh nghiệp đã xác minh' : me.role}</p></div><PillButton variant="secondary" disabled={busy} onClick={() => void run(load)}>Làm mới</PillButton></header><div className="gm-page-content"><div className="gm-page-intro"><div><span className="gm-eyebrow">GOMATE WORKSPACE</span><h2>{navigation.find(([id]) => id === section)?.[1] || 'Tổng quan'}</h2><p>{business ? 'Sự kiện thật, ưu đãi rõ ràng, kết nối cộng đồng.' : reviewing ? 'Kiểm tra hồ sơ và sự kiện trước khi hiển thị trên app.' : 'Xác minh để trở thành đơn vị tổ chức trên GoMate.'}</p></div></div>{alerts}
    {section === 'overview' && (business || reviewing) && <div className="gm-metric-grid">{(business ? [['Bài đăng', data.metrics.posts || 0, 'edit'], ['Chờ duyệt', data.metrics.pendingPosts || 0, 'shield'], ['Đã duyệt', data.metrics.approvedPosts || 0, 'check']] : [['Hồ sơ chờ duyệt', data.metrics.pendingBusinesses || 0, 'users'], ['Bài chờ duyệt', data.metrics.pendingPosts || 0, 'edit'], ['Tài khoản', data.metrics.users || 0, 'users']]).map(([label, value, icon]) => <MetricCard key={label} label={label} value={value} icon={icon} tone="purple" />)}</div>}
    {!business && !reviewing && <section className="gm-panel gm-live-panel"><h3>Hồ sơ xác minh doanh nghiệp</h3>{me.application && <><StatusPill tone={tone(me.application.status)}>{statusLabel[me.application.status]}</StatusPill><p>{me.application.company}</p>{me.application.reviewNote && <p>{me.application.reviewNote}</p>}</>}{(!me.application || me.application.status === 'rejected') && <form className="gm-auth-form" onSubmit={apply}><Field label="Tên doanh nghiệp"><input className={fieldStyle} value={application.company} required onChange={event => setApplication(value => ({ ...value, company: event.target.value }))} /></Field><Field label="Lĩnh vực"><input className={fieldStyle} value={application.category} required onChange={event => setApplication(value => ({ ...value, category: event.target.value }))} /></Field><Field label="Website (không bắt buộc)"><input type="url" className={fieldStyle} value={application.website} onChange={event => setApplication(value => ({ ...value, website: event.target.value }))} /></Field><Field label="Hồ sơ xác minh"><input type="file" accept="application/pdf,image/png,image/jpeg" required onChange={event => setDocument(event.target.files?.[0])} /></Field><PillButton type="submit" disabled={busy}>Gửi hồ sơ xác minh</PillButton></form>}</section>}
    {business && ['studio', 'overview'].includes(section) && <div className="gm-business-grid"><section className="gm-panel gm-live-panel gm-composer-panel"><div className="gm-panel-heading"><div><span className="gm-eyebrow">SỰ KIỆN DOANH NGHIỆP</span><h3>Tạo sự kiện</h3></div><StatusPill tone="green">Đã xác minh</StatusPill></div><form className="gm-auth-form" onSubmit={publish}><Field label="Tên sự kiện"><input className={fieldStyle} required minLength={3} maxLength={120} value={draft.title} onChange={patch('title')} /></Field><Field label="Mô tả sự kiện"><textarea className={fieldStyle + ' gm-textarea'} required maxLength={3000} value={draft.copy} onChange={patch('copy')} /></Field><div className="gm-field-grid"><Field label="Danh mục"><select className={fieldStyle} value={draft.category} onChange={patch('category')}>{['Workshop', 'Cà phê', 'Thể thao', 'Du lịch', 'Âm nhạc', 'Nghệ thuật', 'Networking'].map(value => <option key={value}>{value}</option>)}</select></Field><Field label="Sức chứa (gồm người tổ chức)"><input type="number" className={fieldStyle} min={2} max={1000} required value={draft.maxParticipants} onChange={patch('maxParticipants')} /></Field></div><Field label="Địa điểm"><input className={fieldStyle} required value={draft.location} onChange={patch('location')} /></Field><Field label="Điểm đón / hướng dẫn đến"><input className={fieldStyle} value={draft.meetingPoint} onChange={patch('meetingPoint')} /></Field><div className="gm-field-grid"><Field label="Bắt đầu (giờ Việt Nam)"><input className={fieldStyle} type="datetime-local" required value={draft.startsAt} onChange={patch('startsAt')} /></Field><Field label="Kết thúc (giờ Việt Nam)"><input className={fieldStyle} type="datetime-local" required value={draft.endsAt} onChange={patch('endsAt')} /></Field></div><div className="gm-field-grid"><Field label="Giá sau ưu đãi / người (VND)"><input className={fieldStyle} type="number" min={0} required value={draft.estimatedCost} onChange={patch('estimatedCost')} /></Field><Field label="Giảm giá (%)"><input className={fieldStyle} type="number" min={0} max={100} value={draft.discountPercent} onChange={patch('discountPercent')} /></Field></div><Field label="Nội dung ưu đãi"><input className={fieldStyle} maxLength={200} placeholder="Ví dụ: Tặng đồ uống cho thành viên GoMate" value={draft.offer} onChange={patch('offer')} /></Field><Field label="Điều kiện áp dụng"><textarea className={fieldStyle} maxLength={500} value={draft.offerTerms} onChange={patch('offerTerms')} /></Field><PillButton type="submit" disabled={busy}>{busy ? 'Đang gửi...' : 'Gửi sự kiện cho staff duyệt'}</PillButton></form></section><section className="gm-panel gm-live-panel"><span className="gm-eyebrow">XEM TRƯỚC TRONG APP</span><div className="gm-live-business-preview"><StatusPill tone="green">Doanh nghiệp đã xác minh</StatusPill><div className="gm-live-offer">{draft.discountPercent ? `−${draft.discountPercent}%` : 'GOMATE PARTNER'}</div><h3>{draft.title || 'Tên sự kiện của bạn'}</h3><p>{me.application?.company}</p><p>{draft.offer || 'Ưu đãi riêng dành cho cộng đồng GoMate'}</p><small>{draft.location} · {draft.maxParticipants} người</small></div><p className="gm-live-muted">Staff duyệt nội dung và ưu đãi. Lịch đã duyệt được chốt chính thức; thành viên tự đăng ký và chờ doanh nghiệp xác nhận.</p></section></div>}
    {reviewing && ['overview', 'businesses'].includes(section) && <section className="gm-panel gm-live-panel"><h3>Hồ sơ doanh nghiệp</h3>{!data.applications.length && <p>Chưa có hồ sơ.</p>}{data.applications.map(row => <article className="gm-live-review" key={row.id}><div><h4>{row.company}</h4><p>{row.category} · {row.website || 'Chưa có website'}</p><StatusPill tone={tone(row.status)}>{statusLabel[row.status]}</StatusPill></div><button className="gm-text-action" onClick={() => download(row)}>Tải hồ sơ xác minh ↗</button>{row.status === 'pending' && <><input aria-label={'Ghi chú hồ sơ ' + row.company} className={fieldStyle} placeholder="Ghi chú kiểm duyệt" value={notes[row.id] || ''} onChange={event => setNotes(value => ({ ...value, [row.id]: event.target.value }))} /><div className="gm-live-actions"><PillButton disabled={busy} onClick={() => decide('applications', row, 'approved')}>Duyệt doanh nghiệp</PillButton><PillButton disabled={busy} variant="secondary" onClick={() => decide('applications', row, 'rejected')}>Từ chối hồ sơ</PillButton></div></>}</article>)}</section>}
    {(business || reviewing) && ['overview', 'posts'].includes(section) && <section className="gm-panel gm-live-panel"><h3>{business ? 'Bài đăng của tôi' : 'Duyệt bài đăng'}</h3>{!data.posts.length && <p>Chưa có bài đăng.</p>}{data.posts.map(row => <article className="gm-live-review" key={row.id}><div className="gm-live-review-title"><h4>{row.title}</h4><StatusPill tone={tone(row.status)}>{statusLabel[row.status]}</StatusPill></div><p>{row.businessName} · {row.copy}</p>{row.event && <p>{format(row.event.startsAt)} → {format(row.event.endsAt)} · {row.event.location} · {row.event.maxParticipants} người</p>}<p>{row.discountPercent ? `Giảm ${row.discountPercent}% · ` : ''}{row.offer || row.discount}{row.offerTerms ? ' · ' + row.offerTerms : ''}</p>{row.reviewNote && <p>Ghi chú: {row.reviewNote}</p>}{row.activityId && row.status === 'approved' && <a href={`/#/app/home/activityDetail/${row.activityId}`}>Xem sự kiện trong app ↗</a>}{reviewing && row.status === 'pending' && <><input aria-label={'Ghi chú bài ' + row.title} className={fieldStyle} placeholder="Ghi chú kiểm duyệt" value={notes[row.id] || ''} onChange={event => setNotes(value => ({ ...value, [row.id]: event.target.value }))} /><div className="gm-live-actions"><PillButton disabled={busy} onClick={() => decide('posts', row, 'approved')}>Duyệt và đưa lên app</PillButton><PillButton disabled={busy} variant="secondary" onClick={() => decide('posts', row, 'rejected')}>Từ chối bài</PillButton></div></>}</article>)}</section>}
    {me.role === 'admin' && section === 'users' && <section className="gm-panel gm-live-panel"><h3>Tài khoản GoMate</h3>{data.users.map(row => <div className="gm-live-review" key={row.id}><strong>{row.name}</strong><span>{row.email}</span><StatusPill>{row.effectiveRole}</StatusPill></div>)}</section>}
  </div></main></div></div>;
}
