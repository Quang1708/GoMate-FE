import { Icon, PillButton, StatusPill } from './GoMatePortal';

const fieldStyle = 'gm-simple-input';

function Field({ label, children }) {
  return <label className="gm-field"><span>{label}</span>{children}</label>;
}

export default function BusinessVerificationForm({
  application,
  setApplication,
  document,
  setDocument,
  applicationDetails,
  currentApplication,
  busy,
  onSubmit,
}) {
  const patch = key => event => setApplication(value => ({ ...value, [key]: event.target.value }));
  const submittedDetails = applicationDetails;

  return (
    <section className="gm-panel gm-live-panel gm-verification-panel">
      <div className="gm-panel-heading">
        <div>
          <span className="gm-eyebrow">HỒ SƠ ĐỐI TÁC</span>
          <h3>Hồ sơ xác minh doanh nghiệp</h3>
        </div>
        {currentApplication && <StatusPill tone={currentApplication.status === 'rejected' ? 'red' : currentApplication.status === 'approved' ? 'green' : 'orange'}>
          {currentApplication.status === 'approved' ? 'Đã duyệt' : currentApplication.status === 'rejected' ? 'Cần cập nhật' : 'Chờ duyệt'}
        </StatusPill>}
      </div>

      {currentApplication && <div className="gm-verification-summary">
        <strong>{currentApplication.company}</strong>
        <span>{currentApplication.category}{currentApplication.website ? ` · ${currentApplication.website}` : ''}</span>
        {currentApplication.reviewNote && <p>{currentApplication.reviewNote}</p>}
        {submittedDetails && <dl>
          <div><dt>Mã số thuế</dt><dd>{submittedDetails.taxId}</dd></div>
          <div><dt>Địa chỉ</dt><dd>{submittedDetails.address}</dd></div>
          <div><dt>Người đại diện</dt><dd>{submittedDetails.representativeName} · {submittedDetails.representativeTitle}</dd></div>
          <div><dt>Liên hệ</dt><dd>{submittedDetails.representativeEmail} · {submittedDetails.representativePhone}</dd></div>
          <div><dt>Giấy phép</dt><dd>{submittedDetails.licenseName}</dd></div>
        </dl>}
      </div>}

      {(!currentApplication || currentApplication.status === 'rejected') && <form className="gm-auth-form gm-verification-form" onSubmit={onSubmit}>
        <div className="gm-verification-section-title"><span>01</span><strong>Thông tin doanh nghiệp</strong></div>
        <Field label="Tên doanh nghiệp">
          <input className={fieldStyle} autoComplete="organization" maxLength={150} value={application.company} required onChange={patch('company')} placeholder="Theo đúng giấy phép kinh doanh" />
        </Field>
        <div className="gm-field-grid">
          <Field label="Mã số thuế">
            <input className={fieldStyle} inputMode="numeric" minLength={8} maxLength={20} value={application.taxId} required onChange={patch('taxId')} placeholder="Nhập mã số thuế" />
          </Field>
          <Field label="Lĩnh vực hoạt động">
            <input className={fieldStyle} maxLength={100} value={application.category} required onChange={patch('category')} placeholder="Ví dụ: Sự kiện, nhà hàng" />
          </Field>
        </div>
        <Field label="Địa chỉ chi tiết">
          <textarea className={fieldStyle + ' gm-textarea'} maxLength={500} value={application.address} required onChange={patch('address')} placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố" />
        </Field>
        <Field label="Website (không bắt buộc)">
          <input type="url" className={fieldStyle} autoComplete="url" value={application.website} onChange={patch('website')} placeholder="https://" />
        </Field>

        <div className="gm-verification-section-title"><span>02</span><strong>Người đại diện</strong></div>
        <div className="gm-field-grid">
          <Field label="Họ và tên người đại diện">
            <input className={fieldStyle} autoComplete="name" maxLength={120} value={application.representativeName} required onChange={patch('representativeName')} />
          </Field>
          <Field label="Chức vụ">
            <input className={fieldStyle} maxLength={80} value={application.representativeTitle} required onChange={patch('representativeTitle')} placeholder="Ví dụ: Giám đốc" />
          </Field>
        </div>
        <div className="gm-field-grid">
          <Field label="Email liên hệ">
            <input className={fieldStyle} type="email" autoComplete="email" value={application.representativeEmail} required onChange={patch('representativeEmail')} />
          </Field>
          <Field label="Số điện thoại">
            <input className={fieldStyle} type="tel" autoComplete="tel" value={application.representativePhone} required onChange={patch('representativePhone')} />
          </Field>
        </div>

        <div className="gm-verification-section-title"><span>03</span><strong>Giấy phép kinh doanh</strong></div>
        <label className="gm-upload-field gm-license-upload">
          <span>Hồ sơ xác minh</span>
          <input type="file" accept="application/pdf,image/png,image/jpeg" required onChange={event => setDocument(event.target.files?.[0] || null)} />
          <span className="gm-upload-box">
            <span className="gm-upload-icon"><Icon name="upload" size={18} /></span>
            <strong>{document?.name || 'Tải giấy phép kinh doanh'}</strong>
            <small>Business License Upload · PDF, JPG hoặc PNG · tối đa 10 MB</small>
          </span>
        </label>
        <PillButton type="submit" disabled={busy}>{busy ? 'Đang gửi...' : currentApplication ? 'Gửi lại hồ sơ' : 'Gửi hồ sơ xác minh'}</PillButton>
      </form>}
    </section>
  );
}
