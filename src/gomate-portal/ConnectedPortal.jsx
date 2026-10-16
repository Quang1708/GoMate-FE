import { useCallback, useEffect, useRef, useState } from 'react';
import { GoogleLoginButton } from '../components/GoogleLoginButton';
import { getSession, login, logout, post, setUnauthorizedHandler, verifyEmail } from '../services/api';
import { downloadDocument, portalApi, readDocument, saveBlob } from './portalApi';
import './gomate-portal.css';
import './portal-connected.css';

const labels = { overview: 'Tổng quan', application: 'Hồ sơ doanh nghiệp', posts: 'Bài đăng', applications: 'Duyệt doanh nghiệp', reports: 'Báo cáo', tickets: 'Hỗ trợ', users: 'Người dùng & gói', billing: 'Gói của tôi', feed: 'Bài đã xuất bản' };
const statuses = { pending: 'Chờ duyệt', approved: 'Đã duyệt', rejected: 'Từ chối', open: 'Đang mở', closed: 'Đã đóng', active: 'Đang hoạt động', paused: 'Tạm dừng', cancelled: 'Đã hủy', resolved: 'Đã xử lý', dismissed: 'Không xử lý' };
const date = value => value ? new Date(value).toLocaleString('vi-VN') : '—';
function Status({ value }) { return <span className="gm-status">{statuses[value] || value}</span>; }
function Button({ children, ...props }) { return <button type="button" className="gm-btn gm-btn--primary" {...props}>{children}</button>; }
function Field({ label, ...props }) { return <label className="gm-field"><span>{label}</span><input className="gm-simple-input" {...props} /></label>; }
function ErrorBox({ error }) { return error ? <p className="gm-form-error" role="alert">{error}</p> : null; }
function useAction() {
  const lock = useRef(false), [busy, setBusy] = useState(false), [error, setError] = useState('');
  const run = async action => { if (lock.current) return; lock.current = true; setBusy(true); setError(''); try { await action(); } catch (reason) { setError(reason.message || 'Yêu cầu thất bại.'); } finally { lock.current = false; setBusy(false); } };
  return { run, busy, error };
}
export function LoginPage({ onLogin }) {
  const [stage, setStage] = useState('login'), [email, setEmail] = useState(''), [password, setPassword] = useState(''), [name, setName] = useState(''), [code, setCode] = useState(''), [notice, setNotice] = useState('');
  const action = useAction();
  const submit = event => { event.preventDefault(); void action.run(async () => {
    setNotice('');
    if (stage === 'login') { await login(email, password); await onLogin(); }
    if (stage === 'register') { await post('/auth/register', { email, name, password }); setStage('verify'); setNotice('Nhập mã xác minh đã gửi tới email.'); }
    if (stage === 'verify') { await verifyEmail(email, code); await onLogin(); }
    if (stage === 'forgot') { await post('/auth/forgot-password', { email }); setStage('reset'); setNotice('Nếu tài khoản hợp lệ, mã khôi phục đã được gửi qua email.'); }
    if (stage === 'reset') { await post('/auth/reset-password', { email, code, newPassword: password }); setStage('login'); setNotice('Đã đổi mật khẩu. Đăng nhập lại để tiếp tục.'); }
  }); };
  return <main className="portal-auth"><a href="/">GoMate · Về ứng dụng</a><section className="gm-panel portal-card"><h1>GoMate Portal</h1><p>Không gian dành cho doanh nghiệp và đội ngũ quản trị.</p><h2>{{ login: 'Đăng nhập', register: 'Tạo tài khoản', verify: 'Xác minh email', forgot: 'Quên mật khẩu', reset: 'Đặt lại mật khẩu' }[stage]}</h2>
    <form onSubmit={submit}><fieldset disabled={action.busy}>
      {stage === 'register' && <Field label="Họ tên" value={name} onChange={e => setName(e.target.value)} required maxLength={100} />}
      <Field label="Email" type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} required />
      {['login', 'register', 'reset'].includes(stage) && <Field label={stage === 'reset' ? 'Mật khẩu mới' : 'Mật khẩu'} type="password" autoComplete={stage === 'login' ? 'current-password' : 'new-password'} value={password} onChange={e => setPassword(e.target.value)} required minLength={6} maxLength={128} />}
      {['verify', 'reset'].includes(stage) && <Field label="Mã 6 chữ số" value={code} onChange={e => setCode(e.target.value)} required pattern="[0-9]{6}" inputMode="numeric" />}
      <ErrorBox error={action.error} />{notice && <p role="status">{notice}</p>}<Button type="submit">{action.busy ? 'Đang xử lý…' : 'Tiếp tục'}</Button>
      <div className="portal-actions">{stage !== 'login' && <button type="button" onClick={() => setStage('login')}>Đăng nhập</button>}{stage === 'login' && <><button type="button" onClick={() => setStage('register')}>Tạo tài khoản</button><button type="button" onClick={() => setStage('forgot')}>Quên mật khẩu</button><button type="button" onClick={() => setStage('verify')}>Xác minh email</button></>}{stage === 'verify' && <button type="button" onClick={() => void action.run(async () => { await post('/auth/resend-verification', { email }); setNotice('Đã yêu cầu gửi mã. Chờ ít nhất 60 giây trước lần tiếp theo.'); })}>Gửi lại mã</button>}</div>
    </fieldset></form>{stage === 'login' && <GoogleLoginButton onLogin={() => void action.run(onLogin)} />}<p>Tài khoản mới gửi hồ sơ doanh nghiệp sau khi xác minh email. Quyền Staff/Admin do quản trị viên cấp.</p>
  </section></main>;
}
function Application({ me, refresh }) {
  const [company, setCompany] = useState(me.application?.company || ''), [website, setWebsite] = useState(me.application?.website || ''), [category, setCategory] = useState(me.application?.category || ''), [file, setFile] = useState(null), action = useAction(), current = me.application;
  return <section className="gm-panel portal-card"><h2>Hồ sơ doanh nghiệp</h2>{current && <p><Status value={current.status} /> {current.reviewNote}</p>}
    {(!current || current.status === 'rejected') ? <form onSubmit={e => { e.preventDefault(); void action.run(async () => { await portalApi('/applications', 'POST', { company, website, category, document: await readDocument(file) }); await refresh(); }); }}><fieldset disabled={action.busy}>
      <Field label="Tên doanh nghiệp" value={company} onChange={e => setCompany(e.target.value)} required maxLength={150} /><Field label="Danh mục" value={category} onChange={e => setCategory(e.target.value)} required maxLength={100} /><Field label="Website (không bắt buộc)" type="url" value={website} onChange={e => setWebsite(e.target.value)} maxLength={500} /><Field label="Giấy tờ xác minh (PDF/PNG/JPEG, tối đa 10 MB)" type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={e => setFile(e.target.files?.[0])} required /><Button type="submit">{action.busy ? 'Đang gửi…' : 'Gửi hồ sơ xét duyệt'}</Button>
    </fieldset></form> : <p>{current.status === 'pending' ? 'Hồ sơ đang chờ quản trị viên xem xét.' : 'Doanh nghiệp đã được phê duyệt.'}</p>}
    <ErrorBox error={action.error} /><Button disabled={action.busy} onClick={() => void action.run(refresh)}>Kiểm tra trạng thái</Button></section>;
}
function RemoteList({ path, render, revision = 0 }) {
  const [page, setPage] = useState(1), [retry, setRetry] = useState(0);
  return <ListPage key={path + ':' + page + ':' + revision + ':' + retry} path={path} page={page} setPage={setPage} retry={() => setRetry(v => v + 1)} render={render} />;
}
function ListPage({ path, page, setPage, retry, render }) {
  const [data, setData] = useState(null), [error, setError] = useState('');
  useEffect(() => { let alive = true; portalApi(path + '?page=' + page).then(value => { if (alive) setData(value); }).catch(reason => { if (alive) setError(reason.message); }); return () => { alive = false; }; }, [path, page]);
  if (error) return <><ErrorBox error={error} /><Button onClick={retry}>Thử lại</Button></>;
  if (!data) return <p role="status">Đang tải…</p>;
  return <><div className="portal-list">{data.items.length ? data.items.map(item => <div key={item.id}>{render(item)}</div>) : <p>Chưa có dữ liệu.</p>}</div><div className="portal-actions"><Button disabled={page === 1} onClick={() => setPage(p => p - 1)}>Trước</Button><span>Trang {page}</span><Button disabled={page * 20 >= (data.total ?? data.items.length)} onClick={() => setPage(p => p + 1)}>Sau</Button></div></>;
}
function Decision({ path, choices, onDone, allowHide = false }) {
  const [note, setNote] = useState(''), [hide, setHide] = useState(false), action = useAction();
  return <div>{!allowHide && <Field label="Ghi chú xét duyệt" value={note} onChange={e => setNote(e.target.value)} maxLength={1000} disabled={action.busy} />}{allowHide && <label><input type="checkbox" checked={hide} onChange={e => setHide(e.target.checked)} disabled={action.busy} />Ẩn hoạt động bị báo cáo</label>}<div className="portal-actions">{choices.map(status => <Button key={status} disabled={action.busy} onClick={() => void action.run(async () => { await portalApi(path, 'PATCH', allowHide ? { status, hideActivity: status === 'resolved' && hide } : { status, reviewNote: note }); onDone(); })}>{statuses[status]}</Button>)}</div><ErrorBox error={action.error} /></div>;
}
function Posts({ me }) {
  const [revision, setRevision] = useState(0), action = useAction(), [draft, setDraft] = useState({ title: '', copy: '', badge: '', discount: '', border: 'Soft', premium: false }), business = me.role === 'business', reload = () => setRevision(v => v + 1);
  return <><h2>{business ? 'Bài đăng doanh nghiệp' : 'Kiểm duyệt bài đăng'}</h2>{business && <section className="gm-panel portal-card"><form onSubmit={e => { e.preventDefault(); void action.run(async () => { await portalApi('/posts', 'POST', draft); setDraft(d => ({ ...d, title: '', copy: '' })); reload(); }); }}><fieldset disabled={action.busy}>
    <Field label="Tiêu đề" required value={draft.title} maxLength={120} onChange={e => setDraft({ ...draft, title: e.target.value })} /><label className="gm-field"><span>Nội dung</span><textarea required maxLength={3000} value={draft.copy} onChange={e => setDraft({ ...draft, copy: e.target.value })} /></label><label><input type="checkbox" checked={draft.premium} disabled={me.subscription.plan !== 'plus' || me.subscription.status !== 'active'} onChange={e => setDraft({ ...draft, premium: e.target.checked })} />Trang trí Plus</label>
    {draft.premium && <><Field label="Nhãn" maxLength={60} value={draft.badge} onChange={e => setDraft({ ...draft, badge: e.target.value })} /><Field label="Ưu đãi" maxLength={60} value={draft.discount} onChange={e => setDraft({ ...draft, discount: e.target.value })} /><label>Kiểu viền <select aria-label="Kiểu viền" value={draft.border} onChange={e => setDraft({ ...draft, border: e.target.value })}>{['Soft', 'Glow', 'Solid'].map(v => <option key={v}>{v}</option>)}</select></label></>}
    <Button type="submit">Gửi duyệt</Button><ErrorBox error={action.error} /></fieldset></form></section>}
    <RemoteList path="/posts" revision={revision} render={item => <article className="gm-panel portal-card"><h3>{item.title}</h3><p>{item.businessName} · {date(item.createdAt)}</p><p className="portal-text">{item.copy}</p><Status value={item.status} /><p>{item.reviewNote}</p>{!business && item.status === 'pending' && <Decision path={`/posts/${item.id}`} choices={['approved', 'rejected']} onDone={reload} />}</article>} /></>;
}
function Applications() {
  const [revision, setRevision] = useState(0), action = useAction();
  return <><h2>Duyệt hồ sơ doanh nghiệp</h2><ErrorBox error={action.error} /><RemoteList path="/applications" revision={revision} render={item => <article className="gm-panel portal-card"><h3>{item.company}</h3><p>{item.category} · {item.website}</p><Status value={item.status} /><p>{item.reviewNote}</p><Button disabled={action.busy} onClick={() => void action.run(() => downloadDocument(item.id))}>Tải giấy tờ để xem xét</Button>{item.status === 'pending' && <Decision path={`/applications/${item.id}`} choices={['approved', 'rejected']} onDone={() => setRevision(v => v + 1)} />}</article>} /></>;
}
function Reports() {
  const [revision, setRevision] = useState(0);
  return <><h2>Báo cáo từ người dùng</h2><RemoteList path="/reports" revision={revision} render={item => <article className="gm-panel portal-card"><h3>{item.reason}</h3><p>{item.detail}</p><p>Hoạt động: {item.activityId}</p><Status value={item.status} />{item.status === 'pending' && <Decision path={`/reports/${item.id}`} choices={['resolved', 'dismissed']} allowHide onDone={() => setRevision(v => v + 1)} />}</article>} /></>;
}
function Ticket({ item, staff, reload }) {
  const [message, setMessage] = useState(''), [status, setStatus] = useState('open'), action = useAction();
  return <article className="gm-panel portal-card"><h3>{item.subject}</h3><Status value={item.status} />{item.messages.map(msg => <div className="portal-message" key={msg.id}><small>{msg.authorId === item.ownerId ? 'Người gửi' : 'Hỗ trợ'} · {date(msg.createdAt)}</small><p className="portal-text">{msg.text}</p></div>)}<form onSubmit={e => { e.preventDefault(); void action.run(async () => { await portalApi(`/tickets/${item.id}/replies`, 'POST', { message, status }); setMessage(''); reload(); }); }}><fieldset disabled={action.busy}><Field label="Trả lời" value={message} onChange={e => setMessage(e.target.value)} required maxLength={3000} />{staff && <label>Trạng thái <select aria-label="Trạng thái" value={status} onChange={e => setStatus(e.target.value)}><option value="open">Đang mở</option><option value="closed">Đóng sau khi trả lời</option></select></label>}<Button type="submit">Gửi trả lời</Button><ErrorBox error={action.error} /></fieldset></form></article>;
}
function Tickets({ me }) {
  const [revision, setRevision] = useState(0), [subject, setSubject] = useState(''), [message, setMessage] = useState(''), action = useAction(), reload = () => setRevision(v => v + 1);
  return <><h2>Yêu cầu hỗ trợ</h2><section className="gm-panel portal-card"><form onSubmit={e => { e.preventDefault(); void action.run(async () => { await portalApi('/tickets', 'POST', { subject, message }); setSubject(''); setMessage(''); reload(); }); }}><fieldset disabled={action.busy}><Field label="Tiêu đề" required maxLength={150} value={subject} onChange={e => setSubject(e.target.value)} /><Field label="Nội dung cần hỗ trợ" required maxLength={3000} value={message} onChange={e => setMessage(e.target.value)} /><Button type="submit">Gửi yêu cầu</Button><ErrorBox error={action.error} /></fieldset></form></section><RemoteList path="/tickets" revision={revision} render={item => <Ticket item={item} staff={['staff', 'admin'].includes(me.role)} reload={reload} />} /></>;
}
function UserRow({ item }) {
  const [plan, setPlan] = useState(item.subscription?.plan || 'free'), [status, setStatus] = useState(item.subscription?.status || 'active'), [saved, setSaved] = useState(false), action = useAction();
  return <article className="gm-panel portal-card"><h3>{item.name}</h3><p>{item.email} · {item.role || 'user'}</p><form onSubmit={e => { e.preventDefault(); void action.run(async () => { setSaved(false); await portalApi(`/users/${item.id}/subscription`, 'PATCH', { plan, status }); setSaved(true); }); }}><fieldset disabled={action.busy}><label>Gói <select aria-label="Gói" value={plan} onChange={e => { setPlan(e.target.value); setSaved(false); }}><option value="free">Free</option><option value="plus">Plus</option></select></label><label>Trạng thái <select aria-label="Trạng thái" value={status} onChange={e => { setStatus(e.target.value); setSaved(false); }}>{['active', 'paused', 'cancelled'].map(v => <option key={v} value={v}>{statuses[v]}</option>)}</select></label><Button type="submit">Lưu gói</Button>{saved && <span role="status">Đã lưu</span>}<ErrorBox error={action.error} /></fieldset></form></article>;
}
function Overview({ me }) {
  const [metrics, setMetrics] = useState(null), [error, setError] = useState(''), [retry, setRetry] = useState(0);
  useEffect(() => { let alive = true; portalApi('/metrics').then(data => { if (alive) { setMetrics(data); setError(''); } }).catch(e => { if (alive) setError(e.message); }); return () => { alive = false; }; }, [retry]);
  const names = { posts: 'Bài đăng', pendingPosts: 'Bài chờ duyệt', approvedPosts: 'Bài được duyệt', users: 'Người dùng', pendingBusinesses: 'Doanh nghiệp chờ duyệt', openTickets: 'Ticket đang mở', openReports: 'Báo cáo chờ xử lý' };
  return <><h2>Chào {me.name}</h2><ErrorBox error={error} /><Button onClick={() => setRetry(v => v + 1)}>Làm mới số liệu</Button><div className="portal-metrics">{metrics && Object.entries(metrics).map(([key, value]) => <article key={key} className="gm-panel portal-card"><span>{names[key] || key}</span><h2>{value}</h2></article>)}</div>{metrics && me.role === 'admin' && <Button onClick={() => saveBlob(new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), metrics }, null, 2)], { type: 'application/json' }), 'gomate-report.json')}>Xuất báo cáo tổng quan</Button>}</>;
}
export function GoMatePortal() {
  const [me, setMe] = useState(null), [loading, setLoading] = useState(Boolean(getSession())), [bootError, setBootError] = useState(''), [section, setSection] = useState('overview'), action = useAction();
  useEffect(() => { setUnauthorizedHandler(() => { setMe(null); setBootError(''); }); return () => setUnauthorizedHandler(); }, []);
  const refresh = useCallback(async () => { const user = await portalApi('/me'); setMe(user); setBootError(''); }, []);
  useEffect(() => { if (!getSession()) return; let alive = true; portalApi('/me').then(user => { if (alive) setMe(user); }).catch(error => { if (alive && getSession()) setBootError(error.message); }).finally(() => { if (alive) setLoading(false); }); return () => { alive = false; }; }, []);
  if (loading) return <main className="portal-auth">Đang tải phiên đăng nhập…</main>;
  if (bootError) return <main className="portal-auth"><ErrorBox error={bootError} /><Button onClick={() => void action.run(refresh)}>Thử lại</Button><ErrorBox error={action.error} /><Button onClick={() => void logout().catch(() => {}).finally(() => { setMe(null); setBootError(''); })}>Đăng xuất</Button></main>;
  if (!me) return <div className="gomate-portal"><LoginPage onLogin={refresh} /></div>;
  const sections = me.role === 'admin' ? ['overview', 'applications', 'posts', 'reports', 'tickets', 'users', 'feed'] : me.role === 'staff' ? ['overview', 'posts', 'reports', 'tickets', 'feed'] : me.role === 'business' ? ['overview', 'posts', 'billing', 'application', 'tickets', 'feed'] : ['application', 'tickets', 'feed'], current = sections.includes(section) ? section : sections[0];
  return <div className="gomate-portal"><div className="portal-layout"><aside className="portal-sidebar"><a className="gm-logo-text" href="/">GoMate</a><p>{me.name}</p><Status value={me.role} /><nav>{sections.map(key => <button key={key} className={`gm-nav-item ${current === key ? 'is-active' : ''}`} onClick={() => setSection(key)}>{labels[key]}</button>)}</nav><Button disabled={action.busy} onClick={() => void action.run(async () => { try { await logout(); } finally { setMe(null); } })}>Đăng xuất</Button><ErrorBox error={action.error} /></aside><main className="portal-main" key={current}>
    {current === 'overview' && <Overview me={me} />}{current === 'application' && <Application me={me} refresh={refresh} />}{current === 'applications' && <Applications />}{current === 'posts' && <Posts me={me} />}{current === 'reports' && <Reports />}{current === 'tickets' && <Tickets me={me} />}
    {current === 'users' && <><h2>Quản lý gói người dùng</h2><p>Thay đổi quyền sử dụng gói; không thực hiện thu tiền.</p><RemoteList path="/users" render={item => <UserRow item={item} />} /></>}
    {current === 'billing' && <section className="gm-panel portal-card"><h2>Gói {me.subscription.plan === 'plus' ? 'GoMate Plus' : 'Free'}</h2><Status value={me.subscription.status} /><p>Liên hệ hỗ trợ để yêu cầu thay đổi gói.</p><Button onClick={() => setSection('tickets')}>Liên hệ hỗ trợ</Button><Button disabled={action.busy} onClick={() => void action.run(refresh)}>Cập nhật trạng thái gói</Button></section>}
    {current === 'feed' && <><h2>Bài đăng đã xuất bản</h2><RemoteList path="/feed" render={item => <article className={`gm-panel portal-card ${item.premium ? 'portal-premium' : ''}`}><p>{item.businessName}</p><h3>{item.title}</h3><p className="portal-text">{item.copy}</p>{item.premium && <p>{item.badge} · {item.discount}</p>}<small>{date(item.createdAt)}</small></article>} /></>}
  </main></div></div>;
}
export default GoMatePortal;
