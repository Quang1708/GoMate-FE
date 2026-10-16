import { adminSections } from './AdminDashboard';
const titles = { overview: 'Tổng quan', applications: 'Duyệt doanh nghiệp', posts: 'Bài đăng', reports: 'Báo cáo', tickets: 'Hỗ trợ', users: 'Người dùng & gói', feed: 'Bài đã xuất bản', billing: 'Gói của tôi', application: 'Hồ sơ doanh nghiệp' };

function Navigation({ sections, current, onSelect }) {
  return <nav aria-label="Chức năng">{sections.map(key => <button type="button" key={key} aria-current={current === key ? 'page' : undefined} className={`gm-nav-item ${current === key ? 'is-active' : ''}`} onClick={() => onSelect(key)}>{titles[key]}</button>)}</nav>;
}

export function AdminWorkspace({ me, children, account, ...nav }) {
  return <div className="workspace-admin portal-layout"><aside className="portal-sidebar"><a className="workspace-brand" href="/admin">GoMate <strong>ADMIN</strong></a><p>QUẢN TRỊ HỆ THỐNG</p><nav aria-label="Chức năng">{nav.sections.map(key => <button type="button" key={key} aria-current={nav.current === key ? 'page' : undefined} className={`gm-nav-item ${nav.current === key ? 'is-active' : ''}`} onClick={() => nav.onSelect(key)}><span className="admin-nav-icon" aria-hidden="true">{adminSections[key][2]}</span>{adminSections[key][0]}</button>)}</nav><div className="workspace-account"><b>{me.name}</b>{account}</div></aside><div className="workspace-body"><header className="workspace-header"><span>Trung tâm quản trị / {adminSections[nav.current]?.[0] || titles[nav.current]}</span><span>Quản trị viên</span></header><main className="portal-main" key={nav.current}><div className="workspace-intro"><small>GOMATE / ADMINISTRATION</small><h1>{adminSections[nav.current]?.[0] || titles[nav.current]}</h1><p>{adminSections[nav.current]?.[1]}</p></div>{children}</main></div></div>;
}

export function StaffWorkspace({ me, children, account, ...nav }) {
  return <div className="workspace-staff"><header className="staff-header"><a className="workspace-brand" href="/staff">GoMate <strong>STAFF DESK</strong></a><div className="staff-account"><span>{me.name}</span>{account}</div></header><div className="staff-banner"><small>KHÔNG GIAN NHÂN VIÊN</small><h1>Kiểm duyệt & chăm sóc cộng đồng</h1><p>Xử lý bài đăng, báo cáo và phản hồi yêu cầu hỗ trợ.</p></div><div className="staff-tabs"><Navigation {...nav} /></div><main className="portal-main" key={nav.current}>{children}</main></div>;
}

export function BusinessWorkspace({ me, children, account, ...nav }) {
  return <div className="workspace-business"><header className="business-header"><a className="workspace-brand" href="/business">GoMate <strong>BUSINESS</strong></a>{account}</header><div className="business-grid"><aside className="business-profile"><div className="business-avatar">{(me.application?.company || me.name || 'B').slice(0, 1)}</div><h2>{me.application?.company || me.name}</h2><p>{me.role === 'business' ? 'Đối tác GoMate' : 'Đăng ký đối tác'}</p><Navigation {...nav} /></aside><main className="portal-main" key={nav.current}><div className="business-welcome"><small>KHÔNG GIAN DOANH NGHIỆP</small><h1>{titles[nav.current]}</h1><p>Kết nối thương hiệu của bạn với cộng đồng GoMate.</p></div>{children}</main></div></div>;
}
