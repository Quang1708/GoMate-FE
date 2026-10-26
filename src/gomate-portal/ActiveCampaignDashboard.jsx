import { usePortalText } from './usePortalText';
import { useMemo, useState } from 'react';
import { Icon, PillButton, StatusPill } from './GoMatePortal';

const fieldStyle = 'gm-simple-input';
const pending = 'pending';

function Field({ label, children }) {
  const t = usePortalText();
  return <label className="gm-field"><span>{t(label)}</span>{children}</label>;
}

function isoDate(daysAhead, hour, minute = 0) {
  const value = new Date(Date.now() + daysAhead * 86400000);
  value.setHours(hour, minute, 0, 0);
  return value.toISOString();
}

const defaultItinerary = (location, idPrefix) => [
  { id: `${idPrefix}-welcome`, time: '09:00', title: 'Welcome & check-in', locationId: location?.id || '', location: location?.name || '', notes: 'Confirm attendance and collect questions.' },
  { id: `${idPrefix}-experience`, time: '09:30', title: 'Community experience', locationId: location?.id || '', location: location?.name || '', notes: 'Main activity led by the assigned staff host.' },
];

const sampleMembers = [
  { id: 'member-anh', name: 'Nguyen Minh Anh', email: 'anh.nguyen@example.com', amount: 50000, status: 'paid', paidAt: isoDate(-1, 10, 20) },
  { id: 'member-khoa', name: 'Tran Duc Khoa', email: 'khoa.tran@example.com', amount: 50000, status: 'paid', paidAt: isoDate(-1, 14, 5) },
  { id: 'member-linh', name: 'Le Bao Linh', email: 'linh.le@example.com', amount: 50000, status: pending, paidAt: '' },
  { id: 'member-thao', name: 'Pham Thu Thao', email: 'thao.pham@example.com', amount: 50000, status: pending, paidAt: '' },
];

export const initialBusinessGroups = [
  {
    id: 'active-group-district-1',
    name: 'Saturday Social · District 1',
    campaignTitle: 'Luma Weekend Social',
    status: 'active',
    startsAt: isoDate(3, 9),
    endsAt: isoDate(3, 12),
    locationId: 'loc-luma-d1',
    location: '15 Nguyen Hue, Ben Nghe Ward',
    meetingPoint: 'Luma Social Club - District 1',
    maxParticipants: 12,
    estimatedCost: 120000,
    depositAmount: 50000,
    depositMembers: sampleMembers,
    itinerary: defaultItinerary({ id: 'loc-luma-d1', name: 'Luma Social Club - District 1' }, 'district-1'),
    notifications: [],
  },
  {
    id: 'active-group-thao-dien',
    name: 'Sunday Social · Thao Dien',
    campaignTitle: 'Luma Weekend Social',
    status: 'active',
    startsAt: isoDate(4, 14),
    endsAt: isoDate(4, 17),
    locationId: 'loc-luma-thao-dien',
    location: '12 Thao Dien Street, Thao Dien Ward',
    meetingPoint: 'Luma Social Club - Thao Dien',
    maxParticipants: 10,
    estimatedCost: 150000,
    depositAmount: 75000,
    depositMembers: [
      { id: 'member-minh', name: 'Vo Hoang Minh', email: 'minh.vo@example.com', amount: 75000, status: 'paid', paidAt: isoDate(-2, 9, 40) },
      { id: 'member-yen', name: 'Do Ngoc Yen', email: 'yen.do@example.com', amount: 75000, status: pending, paidAt: '' },
    ],
    itinerary: defaultItinerary({ id: 'loc-luma-thao-dien', name: 'Luma Social Club - Thao Dien' }, 'thao-dien'),
    notifications: [],
  },
];

function normalizeGroup(group, locations) {
  const location = locations.find(item => item.id === group.locationId) || locations[0];
  return {
    ...group,
    status: group.status || 'active',
    depositMembers: group.depositMembers || [],
    itinerary: group.itinerary || defaultItinerary(location, group.id),
    notifications: group.notifications || [],
    depositAmount: Number(group.depositAmount || 0),
    maxParticipants: Number(group.maxParticipants || 0),
  };
}

export default function ActiveCampaignDashboard({ groups, locations, onGroupsChange }) {
  const t = usePortalText();
  const [selectedId, setSelectedId] = useState(groups[0]?.id || '');
  const [activeTab, setActiveTab] = useState('deposits');
  const [editingItemId, setEditingItemId] = useState('');
  const [itemForm, setItemForm] = useState({ time: '', title: '', locationId: '', notes: '' });
  const [offerForm, setOfferForm] = useState({ title: '', body: '', expiresAt: '' });
  const [offerMessage, setOfferMessage] = useState('');

  const safeGroups = useMemo(() => groups.map(group => normalizeGroup(group, locations)), [groups, locations]);
  const selected = safeGroups.find(group => group.id === selectedId) || safeGroups[0];

  const updateGroup = patch => {
    if (!selected) return;
    onGroupsChange(groups.map(group => group.id === selected.id ? { ...normalizeGroup(group, locations), ...patch } : group));
  };
  const markPaid = memberId => updateGroup({ depositMembers: selected.depositMembers.map(member => member.id === memberId ? { ...member, status: 'paid', paidAt: new Date().toISOString() } : member) });
  const totalCollected = selected?.depositMembers.filter(member => member.status === 'paid').reduce((sum, member) => sum + Number(member.amount || selected.depositAmount || 0), 0) || 0;
  const paidCount = selected?.depositMembers.filter(member => member.status === 'paid').length || 0;
  const allDepositsPaid = Boolean(selected?.depositMembers.length) && paidCount === selected.depositMembers.length;

  const openAddItem = () => {
    setEditingItemId('__new__');
    setItemForm({ time: '', title: '', locationId: selected?.locationId || locations[0]?.id || '', notes: '' });
  };
  const editItem = item => {
    setEditingItemId(item.id);
    setItemForm({ time: item.time, title: item.title, locationId: item.locationId || '', notes: item.notes || '' });
    setActiveTab('itinerary');
  };
  const saveItem = event => {
    event.preventDefault();
    const location = locations.find(item => item.id === itemForm.locationId);
    const item = { ...itemForm, id: editingItemId && editingItemId !== '__new__' ? editingItemId : `itinerary-${Date.now()}`, location: location?.name || '' };
    updateGroup({ itinerary: editingItemId && editingItemId !== '__new__' ? selected.itinerary.map(row => row.id === editingItemId ? item : row) : [...selected.itinerary, item] });
    setEditingItemId('');
    setItemForm({ time: '', title: '', locationId: selected.locationId || '', notes: '' });
  };
  const moveItem = (index, direction) => {
    const nextIndex = index + direction;
    if (!selected || nextIndex < 0 || nextIndex >= selected.itinerary.length) return;
    const next = [...selected.itinerary];
    [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
    updateGroup({ itinerary: next });
  };
  const removeItem = id => updateGroup({ itinerary: selected.itinerary.filter(item => item.id !== id) });

  const sendOffer = event => {
    event.preventDefault();
    const recipients = selected?.depositMembers.length || 0;
    const notification = { id: `offer-${Date.now()}`, ...offerForm, sentAt: new Date().toISOString(), recipients };
    updateGroup({ notifications: [notification, ...(selected.notifications || [])], lastOffer: notification });
    setOfferMessage(`Special offer sent to ${recipients} group members.`);
    setOfferForm({ title: '', body: '', expiresAt: '' });
  };

  if (!selected) return <section className="gm-panel gm-live-panel gm-active-empty"><Icon name="activity" size={26} /><h3>{t("No active groups yet")}</h3><p>{t("Create a promotional post with groups first. Active campaign controls will appear here.")}</p></section>;

  return (
    <div className="gm-active-dashboard">
      <div className="gm-active-header">
        <div><span className="gm-eyebrow">{t("BUSINESS OPERATIONS")}</span><h3>{t("Active Campaign / Group Dashboard")}</h3><p>{t("Manage deposits, confirm the itinerary, and keep every group updated.")}</p></div>
        <div className="gm-active-header-stats"><span><strong>{t(safeGroups.length)}</strong> {t(" active groups")}</span><span><strong>{t(safeGroups.reduce((sum, group) => sum + group.depositMembers.length, 0))}</strong> {t(" members")}</span></div>
      </div>

      <div className="gm-active-selector-row">
        <label className="gm-active-group-select"><span>{t("Manage group")}</span><select className={fieldStyle} value={selected.id} onChange={event => { setSelectedId(event.target.value); setEditingItemId(''); setOfferMessage(''); }}><optgroup label={t(selected.campaignTitle)}>{safeGroups.map(group => <option key={group.id} value={group.id}>{group.name}</option>)}</optgroup></select></label>
        <div className="gm-active-group-meta"><StatusPill tone="green">{t(selected.status === 'active' ? 'Active' : selected.status)}</StatusPill><span>{t(selected.meetingPoint || selected.location)}</span><span>{t(new Date(selected.startsAt).toLocaleDateString('vi-VN'))}</span></div>
      </div>

      <div className="gm-active-kpis">
        <div className="gm-active-kpi"><span className="gm-active-kpi-icon gm-active-kpi-icon--green"><Icon name="wallet" size={17} /></span><div><small>{t("Deposits collected")}</small><strong>{t(totalCollected.toLocaleString('vi-VN'))} {t(" VND")}</strong><span>{t(paidCount)}/{t(selected.depositMembers.length)} {t(" paid")}</span></div></div>
        <div className="gm-active-kpi"><span className="gm-active-kpi-icon gm-active-kpi-icon--purple"><Icon name="users" size={17} /></span><div><small>{t("Group members")}</small><strong>{t(selected.depositMembers.length)}/{t(selected.maxParticipants)}</strong><span>{t(selected.maxParticipants - selected.depositMembers.length)} {t(" seats available")}</span></div></div>
        <div className="gm-active-kpi"><span className="gm-active-kpi-icon gm-active-kpi-icon--orange"><Icon name="shield" size={17} /></span><div><small>{t("Schedule readiness")}</small><strong>{t(allDepositsPaid ? 'Ready to finalize' : 'Awaiting deposits')}</strong><span>{t(allDepositsPaid ? 'All members confirmed' : `${selected.depositMembers.length - paidCount} payment(s) pending`)}</span></div></div>
      </div>

      <div className="gm-active-tabs" role="tablist">
        {[['deposits', 'Deposit tracking'], ['itinerary', 'Lịch trình'], ['offers', 'Offer & notifications']].map(([id, label]) => <button key={id} type="button" role="tab" aria-selected={activeTab === id} className={activeTab === id ? 'is-active' : ''} onClick={() => setActiveTab(id)}>{t(label)}</button>)}
      </div>

      {activeTab === 'deposits' && <section className="gm-panel gm-live-panel gm-active-panel">
        <div className="gm-active-panel-heading"><div><span className="gm-eyebrow">{t("PAYMENT GATE")}</span><h3>{t("Deposit tracking")}</h3><p>{t("Confirm deposits before finalizing the group schedule.")}</p></div><span className={`gm-readiness-chip ${allDepositsPaid ? 'is-ready' : ''}`}><i />{t(allDepositsPaid ? 'Ready to finalize' : 'Schedule locked until paid')}</span></div>
        <div className="gm-deposit-progress"><div><span>{t("Payment progress")}</span><strong>{t(paidCount)} {t(" of ")}{t(selected.depositMembers.length)} {t(" paid")}</strong></div><div className="gm-progress-track"><span style={{ width: `${selected.depositMembers.length ? (paidCount / selected.depositMembers.length) * 100 : 0}%` }} /></div></div>
        <div className="gm-table-wrap gm-deposit-table-wrap"><table className="gm-table gm-deposit-table"><thead><tr><th>{t("Member")}</th><th>{t("Deposit required")}</th><th>{t("Payment status")}</th><th>{t("Paid at")}</th><th /></tr></thead><tbody>{selected.depositMembers.map(member => <tr key={member.id}><td><div className="gm-deposit-member"><span>{t(member.name.split(/\s+/).map(part => part[0]).slice(0, 2).join('').toUpperCase())}</span><div><strong>{member.name}</strong><small>{member.email}</small></div></div></td><td>{t(Number(member.amount || selected.depositAmount).toLocaleString('vi-VN'))} {t(" VND")}</td><td><StatusPill tone={member.status === 'paid' ? 'green' : 'orange'}>{t(member.status === 'paid' ? 'Paid' : 'Pending')}</StatusPill></td><td>{t(member.paidAt ? formatPaymentDate(member.paidAt) : 'Awaiting payment')}</td><td>{member.status !== 'paid' && <button type="button" className="gm-text-action" onClick={() => markPaid(member.id)}>{t("Mark as paid")}</button>}</td></tr>)}</tbody></table></div>
        <div className="gm-deposit-footer"><span>{t("Total deposits collected")}</span><strong>{t(totalCollected.toLocaleString('vi-VN'))} {t(" VND")}</strong>{allDepositsPaid ? <PillButton icon="check">{t("Finalize schedule")}</PillButton> : <small>{t("Finalization becomes available after every member pays.")}</small>}</div>
      </section>}

      {activeTab === 'itinerary' && <section className="gm-panel gm-live-panel gm-active-panel">
        <div className="gm-active-panel-heading"><div><span className="gm-eyebrow">{t("TIMELINE BUILDER")}</span><h3>{t("Lịch trình")}</h3><p>{t("Add, edit, reorder, and pin a saved location for every step.")}</p></div><PillButton icon="plus" onClick={openAddItem}>{t("Add timeline item")}</PillButton></div>
        {editingItemId === '__new__' && <form className="gm-itinerary-editor gm-itinerary-editor--new" onSubmit={saveItem}><ItineraryFields form={itemForm} setForm={setItemForm} locations={locations} /><div className="gm-itinerary-editor-actions"><PillButton type="submit">{t("Add to timeline")}</PillButton><button type="button" className="gm-text-action" onClick={() => setEditingItemId('')}>{t("Cancel")}</button></div></form>}
        <div className="gm-timeline">{selected.itinerary.map((item, index) => <article className="gm-timeline-item" key={item.id}><div className="gm-timeline-rail"><span>{t(item.time)}</span><i /></div><div className="gm-timeline-card">{editingItemId === item.id ? <form className="gm-itinerary-editor" onSubmit={saveItem}><ItineraryFields form={itemForm} setForm={setItemForm} locations={locations} /><div className="gm-itinerary-editor-actions"><PillButton type="submit">{t("Save item")}</PillButton><button type="button" className="gm-text-action" onClick={() => setEditingItemId('')}>{t("Cancel")}</button></div></form> : <><div className="gm-timeline-card-top"><div><h4>{item.title}</h4><span><Icon name="grid" size={12} />{t(item.location || 'Location not pinned')}</span></div><div className="gm-timeline-actions"><button type="button" className="gm-icon-btn" onClick={() => moveItem(index, -1)} disabled={index === 0} aria-label={t("Move timeline item up")}>{t("↑")}</button><button type="button" className="gm-icon-btn" onClick={() => moveItem(index, 1)} disabled={index === selected.itinerary.length - 1} aria-label={t("Move timeline item down")}>{t("↓")}</button><button type="button" className="gm-text-action" onClick={() => editItem(item)}>{t("Edit")}</button><button type="button" className="gm-text-action gm-delete-action" onClick={() => removeItem(item.id)} aria-label={t(`Remove ${item.title}`)}><Icon name="close" size={14} /></button></div></div><p>{t(item.notes || 'No notes added.')}</p></>}</div></article>)}</div>
        {!selected.itinerary.length && <p className="gm-location-empty">{t("No timeline items yet. Add the first step for this group.")}</p>}
      </section>}

      {activeTab === 'offers' && <section className="gm-panel gm-live-panel gm-active-panel">
        <div className="gm-active-panel-heading"><div><span className="gm-eyebrow">{t("MEMBER COMMUNICATION")}</span><h3>{t("Special Offer notifications")}</h3><p>{t("Compose a targeted offer and push it to everyone in this group.")}</p></div><span className="gm-recipient-count"><Icon name="users" size={13} />{t(selected.depositMembers.length)} {t(" recipients")}</span></div>
        <div className="gm-offer-layout"><form className="gm-auth-form gm-offer-form" onSubmit={sendOffer}><Field label={t("Offer title")}><input className={fieldStyle} required maxLength={100} value={offerForm.title} onChange={event => setOfferForm(value => ({ ...value, title: event.target.value }))} placeholder={t("e.g. Free welcome drink")} /></Field><Field label={t("Message")}><textarea className={fieldStyle + ' gm-textarea'} required maxLength={500} value={offerForm.body} onChange={event => setOfferForm(value => ({ ...value, body: event.target.value }))} placeholder={t("Tell group members about the special offer.")} /></Field><Field label={t("Expires on (optional)")}><input className={fieldStyle} type="datetime-local" value={offerForm.expiresAt} onChange={event => setOfferForm(value => ({ ...value, expiresAt: event.target.value }))} /></Field><PillButton type="submit" icon="bell">{t("Push special offer")}</PillButton>{offerMessage && <p className="gm-location-message" role="status">{t(offerMessage)}</p>}</form><div className="gm-offer-preview"><span className="gm-eyebrow">{t("NOTIFICATION PREVIEW")}</span><div className="gm-offer-preview-card"><span className="gm-offer-preview-icon"><Icon name="bell" size={16} /></span><div><strong>{t(offerForm.title || 'Your special offer')}</strong><p>{t(offerForm.body || 'Your offer message will appear here.')}</p>{offerForm.expiresAt && <small>{t("Expires ")}{t(new Date(offerForm.expiresAt).toLocaleString('vi-VN'))}</small>}</div></div><div className="gm-offer-history"><h4>{t("Recently sent")}</h4>{selected.notifications?.length ? selected.notifications.slice(0, 3).map(notification => <div key={notification.id}><span><strong>{t(notification.title)}</strong><small>{t(notification.recipients)} {t(" recipients · ")}{t(formatPaymentDate(notification.sentAt))}</small></span><StatusPill tone="green">{t("Sent")}</StatusPill></div>) : <p>{t("No special offers sent for this group.")}</p>}</div></div></div>
      </section>}
    </div>
  );
}

function ItineraryFields({ form, setForm, locations }) {
  const t = usePortalText();
  const patch = key => event => setForm(value => ({ ...value, [key]: event.target.value }));
  return <div className="gm-itinerary-fields"><div className="gm-field-grid"><Field label={t("Time")}><input className={fieldStyle} type="time" required value={form.time} onChange={patch('time')} /></Field><Field label={t("Timeline title")}><input className={fieldStyle} required maxLength={120} value={form.title} onChange={patch('title')} placeholder={t("e.g. Welcome briefing")} /></Field></div><Field label={t("Quick-select location")}><select className={fieldStyle} value={form.locationId} onChange={patch('locationId')}><option value="">{t("No pinned location")}</option>{locations.map(location => <option key={location.id} value={location.id}>{location.name} {t(" · ")}{t(location.city)}</option>)}</select></Field><Field label={t("Notes")}><textarea className={fieldStyle + ' gm-textarea gm-compact-textarea'} maxLength={300} value={form.notes} onChange={patch('notes')} placeholder={t("Instructions for the staff host")} /></Field></div>;
}

function formatPaymentDate(value) {
  return value ? new Date(value).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' }) : '—';
}
