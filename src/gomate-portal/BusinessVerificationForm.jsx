import { usePortalText } from './usePortalText';
import { Icon, PillButton, StatusPill } from './GoMatePortal';

const fieldStyle = 'gm-simple-input';

function Field({ label, children }) {
  const t = usePortalText();
  return <label className="gm-field"><span>{t(label)}</span>{children}</label>;
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
  const t = usePortalText();
  const patch = key => event => setApplication(value => ({ ...value, [key]: event.target.value }));
  const submittedDetails = applicationDetails;

  return (
    <section className="gm-panel gm-live-panel gm-verification-panel">
      <div className="gm-panel-heading">
        <div>
          <span className="gm-eyebrow">{t("HỒ SƠ ĐỐI TÁC")}</span>
          <h3>{t("Hồ sơ xác minh doanh nghiệp")}</h3>
        </div>
        {currentApplication && <StatusPill tone={currentApplication.status === 'rejected' ? 'red' : currentApplication.status === 'approved' ? 'green' : 'orange'}>
          {t(currentApplication.status === 'approved' ? 'Đã duyệt' : currentApplication.status === 'rejected' ? 'Cần cập nhật' : 'Chờ duyệt')}
        </StatusPill>}
      </div>

      {currentApplication && <div className="gm-verification-summary">
        <strong>{t(currentApplication.company)}</strong>
        <span>{t(currentApplication.category)}{t(currentApplication.website ? ` · ${currentApplication.website}` : '')}</span>
        {currentApplication.reviewNote && <p>{t(currentApplication.reviewNote)}</p>}
        {submittedDetails && <dl>
          <div><dt>{t("Mã số thuế")}</dt><dd>{t(submittedDetails.taxId)}</dd></div>
          <div><dt>{t("Địa chỉ")}</dt><dd>{t(submittedDetails.address)}</dd></div>
          <div><dt>{t("Người đại diện")}</dt><dd>{t(submittedDetails.representativeName)} {t(" · ")}{t(submittedDetails.representativeTitle)}</dd></div>
          <div><dt>{t("Liên hệ")}</dt><dd>{t(submittedDetails.representativeEmail)} {t(" · ")}{t(submittedDetails.representativePhone)}</dd></div>
          <div><dt>{t("Giấy phép")}</dt><dd>{t(submittedDetails.licenseName)}</dd></div>
        </dl>}
      </div>}

      {(!currentApplication || currentApplication.status === 'rejected') && <form className="gm-auth-form gm-verification-form" onSubmit={onSubmit}>
        <div className="gm-verification-section-title"><span>01</span><strong>{t("Thông tin doanh nghiệp")}</strong></div>
        <Field label={t("Tên doanh nghiệp")}>
          <input className={fieldStyle} autoComplete="organization" maxLength={150} value={application.company} required onChange={patch('company')} placeholder={t("Theo đúng giấy phép kinh doanh")} />
        </Field>
        <div className="gm-field-grid">
          <Field label={t("Mã số thuế")}>
            <input className={fieldStyle} inputMode="numeric" minLength={8} maxLength={20} value={application.taxId} required onChange={patch('taxId')} placeholder={t("Nhập mã số thuế")} />
          </Field>
          <Field label={t("Lĩnh vực hoạt động")}>
            <input className={fieldStyle} maxLength={100} value={application.category} required onChange={patch('category')} placeholder={t("Ví dụ: Sự kiện, nhà hàng")} />
          </Field>
        </div>
        <Field label={t("Địa chỉ chi tiết")}>
          <textarea className={fieldStyle + ' gm-textarea'} maxLength={500} value={application.address} required onChange={patch('address')} placeholder={t("Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố")} />
        </Field>
        <Field label={t("Website (không bắt buộc)")}>
          <input type="url" className={fieldStyle} autoComplete="url" value={application.website} onChange={patch('website')} placeholder={t("https://")} />
        </Field>

        <div className="gm-verification-section-title"><span>02</span><strong>{t("Người đại diện")}</strong></div>
        <div className="gm-field-grid">
          <Field label={t("Họ và tên người đại diện")}>
            <input className={fieldStyle} autoComplete="name" maxLength={120} value={application.representativeName} required onChange={patch('representativeName')} />
          </Field>
          <Field label={t("Chức vụ")}>
            <input className={fieldStyle} maxLength={80} value={application.representativeTitle} required onChange={patch('representativeTitle')} placeholder={t("Ví dụ: Giám đốc")} />
          </Field>
        </div>
        <div className="gm-field-grid">
          <Field label={t("Email liên hệ")}>
            <input className={fieldStyle} type="email" autoComplete="email" value={application.representativeEmail} required onChange={patch('representativeEmail')} />
          </Field>
          <Field label={t("Số điện thoại")}>
            <input className={fieldStyle} type="tel" autoComplete="tel" value={application.representativePhone} required onChange={patch('representativePhone')} />
          </Field>
        </div>

        <div className="gm-verification-section-title"><span>03</span><strong>{t("Giấy phép kinh doanh")}</strong></div>
        <label className="gm-upload-field gm-license-upload">
          <span>{t("Hồ sơ xác minh")}</span>
          <input type="file" accept="application/pdf,image/png,image/jpeg" required onChange={event => setDocument(event.target.files?.[0] || null)} />
          <span className="gm-upload-box">
            <span className="gm-upload-icon"><Icon name="upload" size={18} /></span>
            <strong>{t(document?.name || 'Tải giấy phép kinh doanh')}</strong>
            <small>{t("Business License Upload · PDF, JPG hoặc PNG · tối đa 10 MB")}</small>
          </span>
        </label>
        <PillButton type="submit" disabled={busy}>{t(busy ? 'Đang gửi...' : currentApplication ? 'Gửi lại hồ sơ' : 'Gửi hồ sơ xác minh')}</PillButton>
      </form>}
    </section>
  );
}
