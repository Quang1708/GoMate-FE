import { useEffect, useState } from 'react';
import { portalApi } from './portalApi';

export const staffSections = {
  overview: ['Tổng quan', 'Bàn trực điều hành, kiểm duyệt nội dung và hỗ trợ người dùng.', '▦'],
  applications: ['Duyệt doanh nghiệp', 'Kiểm tra hồ sơ xác minh đối tác.', '◇'],
  posts: ['Bài đăng', 'Xét duyệt nội dung đối tác doanh nghiệp trước khi xuất bản.', '▧'],
  reports: ['Báo cáo', 'Xử lý phản ánh từ cộng đồng và bảo vệ an toàn môi trường kết nối.', '⚑'],
  tickets: ['Hỗ trợ', 'Phản hồi khiếu nại, giải quyết thắc mắc của người dùng & đối tác.', '☏'],
  feed: ['Bài đã xuất bản', 'Theo dõi trực quan các bài viết đang hiển thị trên bảng tin công khai.', '◈'],
};

export function StaffDashboard({ me, onSelect }) {
  const [data, setData] = useState(null),
    [error, setError] = useState(''),
    [loading, setLoading] = useState(true),
    [retry, setRetry] = useState(0),
    [updated, setUpdated] = useState(null);

  useEffect(() => {
    let alive = true;
    portalApi('/metrics')
      .then(value => {
        if (alive) {
          setData(value);
          setUpdated(new Date());
        }
      })
      .catch(reason => {
        if (alive) setError(reason.message);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [retry]);

  const queueCards = [
    { key: 'pendingBusinesses', title: 'Hồ sơ doanh nghiệp chờ duyệt', target: 'applications', icon: '◇', variant: 'warning', badge: 'Xác minh đối tác', hint: 'Xem hồ sơ' },
    {
      key: 'pendingPosts',
      title: 'Bài đăng chờ duyệt',
      target: 'posts',
      icon: '▧',
      variant: 'warning',
      badge: 'Cần kiểm duyệt',
      hint: 'Mở hàng đợi duyệt',
    },
    {
      key: 'openReports',
      title: 'Báo cáo chờ xử lý',
      target: 'reports',
      icon: '⚑',
      variant: 'danger',
      badge: 'Bảo vệ cộng đồng',
      hint: 'Xử lý báo cáo',
    },
    {
      key: 'openTickets',
      title: 'Yêu cầu hỗ trợ đang mở',
      target: 'tickets',
      icon: '☏',
      variant: 'info',
      badge: 'Chăm sóc người dùng',
      hint: 'Phản hồi ticket',
    },
    {
      key: 'approvedPosts',
      title: 'Bài viết đã xuất bản',
      target: 'feed',
      icon: '◈',
      variant: 'success',
      badge: 'Đang lưu hành',
      hint: 'Xem bảng tin live',
    },
  ];

  return (
    <div className="staff-dashboard">
      <section className="staff-welcome-banner">
        <div className="staff-welcome-content">
          <span className="staff-welcome-eyebrow">BÀN TRỰC ĐIỀU HÀNH & KIỂM DUYỆT</span>
          <h2>Xin chào, {me.name} 👋</h2>
          <p>
            Cùng đảm bảo không gian trải nghiệm an toàn, chuẩn mực và hỗ trợ người dùng GoMate tận tâm.
          </p>

        </div>

      </section>

      <div className="staff-section-heading">
        <div>
          <h2>Hàng đợi xử lý ưu tiên</h2>
          <p>
            {updated
              ? `Cập nhật lúc ${updated.toLocaleTimeString('vi-VN')} · Nhấp vào thẻ để mở nhanh nghiệp vụ`
              : 'Dữ liệu thời gian thực từ máy chủ'}
          </p>
        </div>
        <div className="portal-actions">
          <button
            type="button"
            className="gm-btn gm-btn--ghost"
            disabled={loading}
            onClick={() => {
              setData(null);
              setUpdated(null);
              setError('');
              setLoading(true);
              setRetry(v => v + 1);
            }}
          >
            {loading ? 'Đang tải…' : '🔄 Làm mới số liệu'}
          </button>
        </div>
      </div>

      {error && (
        <p role="alert" className="gm-form-error">
          {error}
        </p>
      )}

      <div className="staff-queue-grid" aria-busy={loading}>
        {queueCards.map(card => {
          const count = data?.[card.key];
          return (
            <button
              type="button"
              key={card.key}
              className={`staff-queue-card staff-queue-card--${card.variant}`}
              onClick={() => onSelect(card.target)}
            >
              <div className="staff-queue-top">
                <span className="staff-queue-icon" aria-hidden="true">
                  {card.icon}
                </span>
                <span className="staff-queue-badge">{card.badge}</span>
              </div>
              <span className="staff-queue-title">{card.title}</span>
              <strong className="staff-queue-count">
                {Number.isFinite(count) ? count.toLocaleString('vi-VN') : '—'}
              </strong>
              <div className="staff-queue-footer">
                <span>{card.hint}</span>
                <span aria-hidden="true">↗</span>
              </div>
            </button>
          );
        })}
      </div>

      <div className="staff-section-heading">
        <div>
          <h2>Nghiệp vụ điều hành</h2>
          <p>Truy cập nhanh các phân hệ làm việc</p>
        </div>
        <span className="staff-count-tag">{queueCards.length} phân hệ</span>
      </div>

      <div className="staff-workflow-grid">
        <button type="button" className="staff-workflow-card" onClick={() => onSelect('applications')}>
          <div className="staff-workflow-info"><h3>Duyệt hồ sơ doanh nghiệp</h3><p>Xem giấy tờ và xét duyệt hồ sơ từ đối tác.</p></div>
        </button>
        <button
          type="button"
          className="staff-workflow-card"
          onClick={() => onSelect('posts')}
        >
          <div className="staff-workflow-icon staff-workflow-icon--posts">▧</div>
          <div className="staff-workflow-info">
            <h3>Kiểm duyệt bài đăng</h3>
            <p>Xét duyệt nội dung thông báo & ưu đãi từ các đối tác doanh nghiệp đã xác minh.</p>
          </div>
          <span className="staff-workflow-arrow" aria-hidden="true">→</span>
        </button>

        <button
          type="button"
          className="staff-workflow-card"
          onClick={() => onSelect('reports')}
        >
          <div className="staff-workflow-icon staff-workflow-icon--reports">⚑</div>
          <div className="staff-workflow-info">
            <h3>Xử lý phản ánh vi phạm</h3>
            <p>Tiếp nhận tố cáo người dùng, vi phạm tiêu chuẩn và ẩn các hoạt động độc hại.</p>
          </div>
          <span className="staff-workflow-arrow" aria-hidden="true">→</span>
        </button>

        <button
          type="button"
          className="staff-workflow-card"
          onClick={() => onSelect('tickets')}
        >
          <div className="staff-workflow-icon staff-workflow-icon--tickets">☏</div>
          <div className="staff-workflow-info">
            <h3>Trung tâm hỗ trợ khách hàng</h3>
            <p>Trao đổi, giải đáp câu hỏi và cập nhật trạng thái yêu cầu hỗ trợ.</p>
          </div>
          <span className="staff-workflow-arrow" aria-hidden="true">→</span>
        </button>

        <button
          type="button"
          className="staff-workflow-card"
          onClick={() => onSelect('feed')}
        >
          <div className="staff-workflow-icon staff-workflow-icon--feed">◈</div>
          <div className="staff-workflow-info">
            <h3>Bảng tin công khai trực tiếp</h3>
            <p>Theo dõi các bài viết đang được cộng đồng người dùng nhìn thấy trong thực tế.</p>
          </div>
          <span className="staff-workflow-arrow" aria-hidden="true">→</span>
        </button>
      </div>


    </div>
  );
}
