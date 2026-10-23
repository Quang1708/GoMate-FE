import { useMemo, useState } from 'react';
import { Icon, PillButton, StatusPill } from './GoMatePortal';

const fieldStyle = 'gm-simple-input';
const staffApprovalLabel = 'Pending Admin (Minh) Approval';
const initialStaffRequests = [
  {
    id: 'staff-review-001',
    name: 'Nguyen Quoc Bao',
    email: 'bao.nguyen@lumasocial.vn',
    phone: '+84 909 123 456',
    title: 'Group host',
    businessName: 'Luma Social Club',
    submittedAt: '2026-10-21T09:20:00+07:00',
    groupNames: ['Saturday Social · District 1', 'Sunday Social · Thao Dien'],
    status: 'pending',
  },
  {
    id: 'staff-review-002',
    name: 'Tran Minh Chau',
    email: 'chau.tran@lumasocial.vn',
    phone: '+84 938 111 290',
    title: 'Event coordinator',
    businessName: 'Luma Social Club',
    submittedAt: '2026-10-22T14:05:00+07:00',
    groupNames: ['Saturday Social · District 1'],
    status: 'pending',
  },
  {
    id: 'staff-review-003',
    name: 'Vo Hoang Minh',
    email: 'minh.vo@kindred.vn',
    phone: '+84 905 442 810',
    title: 'Community manager',
    businessName: 'Kindred Wellness',
    submittedAt: '2026-10-20T16:40:00+07:00',
    groupNames: ['Morning reset workshop'],
    status: 'pending',
  },
];

function valueOrFallback(value) {
  return value === undefined || value === null || String(value).trim() === ''
    ? 'Not provided'
    : value;
}

function labelForStatus(status) {
  if (status === 'approved') return 'Approved';
  if (status === 'rejected') return 'Rejected';
  return 'Pending review';
}

function statusTone(status) {
  return status === 'approved' ? 'green' : status === 'rejected' ? 'red' : 'orange';
}

function initials(name) {
  return String(name || '?').split(/\s+/).map(part => part[0]).slice(0, 2).join('').toUpperCase();
}

function Detail({ label, children }) {
  return <div className="gm-admin-detail"><dt>{label}</dt><dd>{children}</dd></div>;
}

export default function AdminBusinessReview({
  applications,
  busy,
  notes,
  setNotes,
  onApplicationDecision,
  onDownload,
}) {
  const [view, setView] = useState('businesses');
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [staffRequests, setStaffRequests] = useState(initialStaffRequests);
  const [query, setQuery] = useState('');
  const [staffFilter, setStaffFilter] = useState('pending');
  const [staffFeedback, setStaffFeedback] = useState('');
  const [detailError, setDetailError] = useState('');

  const filteredApplications = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    return applications.filter(row => !normalized || `${row.company} ${row.category} ${row.website || ''}`.toLocaleLowerCase().includes(normalized));
  }, [applications, query]);

  const filteredStaff = useMemo(
    () => staffRequests.filter(row => staffFilter === 'all' || row.status === staffFilter),
    [staffRequests, staffFilter],
  );

  const decideStaff = (id, status) => {
    const request = staffRequests.find(row => row.id === id);
    if (!request) return;
    setStaffRequests(current => current.map(row => row.id === id ? { ...row, status, reviewedAt: new Date().toISOString() } : row));
    setStaffFeedback(`${request.name}'s staff request was ${status}.`);
  };

  const representativeName = row => row.representativeName || row.representative?.name;
  const representativeTitle = row => row.representativeTitle || row.representative?.title;
  const representativeEmail = row => row.representativeEmail || row.representative?.email;
  const representativePhone = row => row.representativePhone || row.representative?.phone;
  const taxId = row => row.taxId || row.taxID || row.taxCode;
  const address = row => row.address || row.detailedAddress || row.businessAddress;
  const documentName = row => row.documentName || row.document?.name || row.licenseName || 'Business license document';
  const documentType = row => row.documentMime || row.document?.mime || row.documentType || 'PDF / PNG / JPEG';

  return (
    <div className="gm-admin-business-review">
      <div className="gm-admin-review-heading">
        <div><span className="gm-eyebrow">ADMIN REVIEW</span><h3>Business verification</h3><p>Review business identity documents and requested staff access.</p></div>
        <div className="gm-admin-review-summary"><strong>{applications.filter(row => row.status === 'pending').length}</strong><span>business applications waiting</span></div>
      </div>

      <div className="gm-admin-review-tabs" role="tablist" aria-label="Admin business review">
        <button type="button" role="tab" aria-selected={view === 'businesses'} className={view === 'businesses' ? 'is-active' : ''} onClick={() => setView('businesses')}>Business applications <span>{applications.length}</span></button>
        <button type="button" role="tab" aria-selected={view === 'staff'} className={view === 'staff' ? 'is-active' : ''} onClick={() => setView('staff')}>Business Staff approvals <span>{staffRequests.filter(row => row.status === 'pending').length}</span></button>
      </div>

      {view === 'businesses' && <section className="gm-panel gm-live-panel gm-admin-review-panel">
        <div className="gm-admin-table-toolbar"><div><h3>Business applications</h3><p>Open an application to inspect submitted identity and license details.</p></div><label className="gm-admin-search"><Icon name="search" size={15} /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search businesses" /></label></div>
        {!filteredApplications.length ? <div className="gm-admin-review-empty"><Icon name="check" size={20} /><strong>No matching applications</strong><span>New business verification submissions will appear here.</span></div> : <div className="gm-table-wrap"><table className="gm-table gm-admin-review-table"><thead><tr><th>Business</th><th>Category</th><th>Submitted</th><th>Status</th><th /></tr></thead><tbody>{filteredApplications.map(row => <tr key={row.id}><td><div className="gm-admin-business-cell"><span>{initials(row.company)}</span><div><strong>{row.company}</strong><small>{row.website || 'Website not provided'}</small></div></div></td><td>{row.category || '—'}</td><td>{row.createdAt ? new Date(row.createdAt).toLocaleDateString('vi-VN') : '—'}</td><td><StatusPill tone={statusTone(row.status)}>{labelForStatus(row.status)}</StatusPill></td><td><button type="button" className="gm-text-action" onClick={() => { setSelectedApplication(row); setDetailError(''); }}>Review details</button></td></tr>)}</tbody></table></div>}
      </section>}

      {view === 'staff' && <section className="gm-panel gm-live-panel gm-admin-review-panel">
        <div className="gm-admin-table-toolbar"><div><h3>Business Staff accounts</h3><p>Approve or reject staff access requests submitted by businesses.</p></div><label className="gm-admin-filter"><span>Status</span><select className={fieldStyle} value={staffFilter} onChange={event => setStaffFilter(event.target.value)}><option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option><option value="all">All requests</option></select></label></div>
        {staffFeedback && <div className="gm-admin-feedback" role="status"><Icon name="check" size={15} />{staffFeedback}</div>}
        {!filteredStaff.length ? <div className="gm-admin-review-empty"><Icon name="users" size={20} /><strong>No staff requests in this view</strong><span>New requests will appear here for Admin review.</span></div> : <div className="gm-table-wrap"><table className="gm-table gm-admin-staff-table"><thead><tr><th>Staff member</th><th>Business</th><th>Group assignments</th><th>Submitted</th><th>Status</th><th>Decision</th></tr></thead><tbody>{filteredStaff.map(row => <tr key={row.id}><td><div className="gm-admin-business-cell"><span>{initials(row.name)}</span><div><strong>{row.name}</strong><small>{row.title} · {row.email}<br />{row.phone}</small></div></div></td><td>{row.businessName}</td><td><div className="gm-admin-group-tags">{row.groupNames.map(name => <span key={name}>{name}</span>)}</div></td><td>{new Date(row.submittedAt).toLocaleDateString('vi-VN')}</td><td><StatusPill tone={statusTone(row.status)}>{row.status === 'pending' ? staffApprovalLabel : labelForStatus(row.status)}</StatusPill></td><td>{row.status === 'pending' ? <div className="gm-admin-decision-actions"><PillButton variant="secondary" disabled={busy} onClick={() => decideStaff(row.id, 'approved')}>Approve</PillButton><button type="button" className="gm-admin-reject-button" disabled={busy} onClick={() => decideStaff(row.id, 'rejected')}>Reject</button></div> : <span className="gm-admin-reviewed-label">Reviewed {row.reviewedAt ? new Date(row.reviewedAt).toLocaleDateString('vi-VN') : ''}</span>}</td></tr>)}</tbody></table></div>}
      </section>}

      {selectedApplication && <div className="gm-admin-modal-backdrop" role="presentation" onClick={() => setSelectedApplication(null)}><section className="gm-admin-verification-modal" role="dialog" aria-modal="true" aria-labelledby="gm-admin-modal-title" onClick={event => event.stopPropagation()}>
        <header className="gm-admin-modal-heading"><div><span className="gm-eyebrow">BUSINESS VERIFICATION</span><h3 id="gm-admin-modal-title">{selectedApplication.company}</h3><p>{selectedApplication.category || 'Business'} · {selectedApplication.website || 'Website not provided'}</p></div><button type="button" className="gm-icon-btn" aria-label="Close business review" onClick={() => setSelectedApplication(null)}><Icon name="close" size={17} /></button></header>
        <div className="gm-admin-modal-body">
          <section className="gm-admin-detail-section"><h4>Business identity</h4><dl><Detail label="Full company name">{valueOrFallback(selectedApplication.company)}</Detail><Detail label="Tax ID">{valueOrFallback(taxId(selectedApplication))}</Detail><Detail label="Business category">{valueOrFallback(selectedApplication.category)}</Detail><Detail label="Website">{valueOrFallback(selectedApplication.website)}</Detail><Detail label="Detailed address">{valueOrFallback(address(selectedApplication))}</Detail></dl></section>
          <section className="gm-admin-detail-section"><h4>Representative information</h4><dl><Detail label="Full name">{valueOrFallback(representativeName(selectedApplication))}</Detail><Detail label="Title">{valueOrFallback(representativeTitle(selectedApplication))}</Detail><Detail label="Email">{valueOrFallback(representativeEmail(selectedApplication))}</Detail><Detail label="Phone">{valueOrFallback(representativePhone(selectedApplication))}</Detail></dl></section>
          <section className="gm-admin-detail-section"><h4>Business license</h4><div className="gm-admin-document-row"><span className="gm-admin-document-icon"><Icon name="upload" size={17} /></span><div><strong>{documentName(selectedApplication)}</strong><small>{documentType(selectedApplication)} · Stored as a private verification document</small></div><button type="button" className="gm-text-action" disabled={busy} onClick={() => onDownload(selectedApplication)}>Download</button></div></section>
          {selectedApplication.reviewNote && <div className="gm-admin-review-note"><strong>Previous review note</strong><p>{selectedApplication.reviewNote}</p></div>}
          {selectedApplication.status === 'pending' && <div className="gm-admin-modal-decision"><label className="gm-field"><span>Review note</span><textarea className={fieldStyle + ' gm-textarea'} value={notes[selectedApplication.id] || ''} onChange={event => { setDetailError(''); setNotes(current => ({ ...current, [selectedApplication.id]: event.target.value })); }} placeholder="Required when rejecting an application" /></label>{detailError && <p className="gm-admin-inline-error" role="alert">{detailError}</p>}<div className="gm-admin-decision-actions"><PillButton disabled={busy} onClick={() => { onApplicationDecision(selectedApplication, 'approved'); setSelectedApplication(null); }}>Approve business</PillButton><button type="button" className="gm-admin-reject-button" disabled={busy} onClick={() => { if (!notes[selectedApplication.id]?.trim()) { setDetailError('Add a review note before rejecting this application.'); return; } onApplicationDecision(selectedApplication, 'rejected'); setSelectedApplication(null); }}>Reject application</button></div></div>}
        </div>
      </section></div>}
    </div>
  );
}
