import { useEffect, useState } from 'react';
import { portalApi, saveBlob } from './portalApi';

export const adminSections = {
  overview: ['Tổng quan', 'Theo dõi cộng đồng và các công việc cần xử lý.', '▦'],
  users: ['Quản lý người dùng', 'Danh sách tài khoản và phân quyền User, Staff, Admin.', '♙'],
  applications: ['Duyệt doanh nghiệp', 'Kiểm tra giấy tờ, xét duyệt và phản hồi hồ sơ đối tác.', '▤'],
  posts: ['Kiểm duyệt bài đăng', 'Xét duyệt nội dung doanh nghiệp trước khi xuất bản.', '▧'],
  reports: ['Xử lý báo cáo', 'Tiếp nhận phản ánh và bảo vệ cộng đồng GoMate.', '⚑'],
  tickets: ['Hỗ trợ người dùng', 'Trả lời yêu cầu và theo dõi quá trình giải quyết.', '☏'],
  subscriptions: ['Quản lý gói dịch vụ', 'Quản lý Free, Plus và trạng thái sử dụng. Chưa thu tiền thật.', '◇'],
};

export function AdminDashboard({ me, onSelect }) {
  const [data, setData] = useState(null), [error, setError] = useState(''), [loading, setLoading] = useState(true), [retry, setRetry] = useState(0), [updated, setUpdated] = useState(null);
  useEffect(() => {
    let alive = true;
    portalApi('/metrics').then(value => { if (alive) { setData(value); setUpdated(new Date()); } }).catch(reason => { if (alive) setError(reason.message); }).finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [retry]);
  const cards = [['users', 'Tổng người dùng', 'users'], ['pendingBusinesses', 'Doanh nghiệp chờ duyệt', 'applications'], ['pendingPosts', 'Bài đăng chờ duyệt', 'posts'], ['openTickets', 'Yêu cầu đang mở', 'tickets'], ['openReports', 'Báo cáo chờ xử lý', 'reports']];
  return <>
    <section className="admin-welcome"><div><span className="admin-eyebrow">KHÔNG GIAN QUẢN TRỊ</span><h2>Chào {me.name},</h2><p>Cùng xây dựng một cộng đồng kết nối an toàn và tích cực.</p></div><div className="admin-welcome-mark" aria-hidden="true">G<span>↗</span></div></section>
    <div className="admin-section-heading"><div><h2>Hoạt động hệ thống</h2><p>{updated ? `Cập nhật lúc ${updated.toLocaleTimeString('vi-VN')}` : 'Dữ liệu tổng hợp từ hệ thống'}</p></div><div className="portal-actions"><button className="gm-btn" disabled={loading} onClick={() => { setError(''); setLoading(true); setRetry(v => v + 1); }}>{loading ? 'Đang tải…' : 'Làm mới số liệu'}</button><button className="gm-btn gm-btn--primary" disabled={!data} onClick={() => saveBlob(new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), metrics: data }, null, 2)], { type: 'application/json' }), 'gomate-report.json')}>Xuất báo cáo tổng quan</button></div></div>
    {error && <p role="alert" className="gm-form-error">{error}</p>}
    <div className="admin-stats" aria-busy={loading}>{cards.map(([key, title, target], index) => <button key={key} className={`admin-stat admin-stat-${index}`} onClick={() => onSelect(target)}><span className="admin-stat-icon" aria-hidden="true">{adminSections[target][2]}</span><span>{title}</span><strong>{data ? Number(data[key] || 0).toLocaleString('vi-VN') : '—'}</strong><small>Xem chi tiết <span aria-hidden="true">↗</span></small></button>)}</div>
    <div className="admin-section-heading"><div><h2>Không gian làm việc</h2><p>Truy cập nhanh các chức năng quản trị</p></div><span className="admin-count">6 chức năng</span></div>
    <div className="admin-shortcuts">{Object.entries(adminSections).filter(([key]) => key !== 'overview').map(([key, [title, description, icon]]) => <button key={key} onClick={() => onSelect(key)}><span className="admin-shortcut-icon" aria-hidden="true">{icon}</span><div><h3>{title}</h3><p>{description}</p></div><span aria-hidden="true">→</span></button>)}</div>
  </>;
}
