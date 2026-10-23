import { useState } from 'react';
import { Icon, PillButton } from './GoMatePortal';

const fieldStyle = 'gm-simple-input';
const pendingApproval = 'Pending Admin (Minh) Approval';
const emptyStaff = () => ({ name: '', email: '', phone: '', title: '', groupIds: [] });

function Field({ label, children }) {
  return <label className="gm-field"><span>{label}</span>{children}</label>;
}

export default function BusinessStaffManagement({ groups, accounts, onSave, onDelete }) {
  const [form, setForm] = useState(emptyStaff);
  const [editingId, setEditingId] = useState('');
  const [message, setMessage] = useState('');

  const patch = key => event => setForm(value => ({ ...value, [key]: event.target.value }));
  const toggleGroup = groupId => setForm(value => ({
    ...value,
    groupIds: value.groupIds.includes(groupId) ? value.groupIds.filter(id => id !== groupId) : [...value.groupIds, groupId],
  }));
  const edit = account => {
    setEditingId(account.id);
    setForm({ name: account.name, email: account.email, phone: account.phone, title: account.title, groupIds: [...account.groupIds] });
    setMessage('');
  };
  const reset = ({ clearMessage = true } = {}) => {
    setEditingId('');
    setForm(emptyStaff());
    if (clearMessage) setMessage('');
  };
  const submit = event => {
    event.preventDefault();
    const isEditing = Boolean(editingId);
    onSave({ ...form, id: editingId || `business-staff-${Date.now()}`, status: pendingApproval, updatedAt: new Date().toISOString() });
    reset({ clearMessage: false });
    setMessage(isEditing ? 'Staff details updated.' : 'Staff account request sent for admin approval.');
  };
  const groupName = id => groups.find(group => group.id === id)?.name || 'Group removed';

  return (
    <div className="gm-business-staff-page">
      <div className="gm-business-section-heading gm-staff-page-heading">
        <div className="gm-staff-heading-icon"><Icon name="users" size={18} /></div>
        <div><span className="gm-eyebrow">BUSINESS ACCESS</span><h3>Business Staff</h3><p>Request account access and choose which groups each staff member can manage.</p></div>
      </div>

      <div className="gm-staff-layout">
        <section className="gm-panel gm-live-panel gm-staff-form-panel">
          <div className="gm-panel-heading"><div><h3>{editingId ? 'Edit staff access' : 'Create staff account'}</h3><p className="gm-live-muted">All new accounts require admin approval.</p></div></div>
          <div className="gm-approval-banner"><span className="gm-approval-dot" /><div><strong>{pendingApproval}</strong><span>Account access becomes available after review.</span></div></div>
          <form className="gm-auth-form" onSubmit={submit}>
            <Field label="Full name"><input className={fieldStyle} autoComplete="name" required maxLength={120} value={form.name} onChange={patch('name')} placeholder="Staff member name" /></Field>
            <Field label="Work email"><input className={fieldStyle} type="email" autoComplete="email" required value={form.email} onChange={patch('email')} placeholder="name@business.com" /></Field>
            <div className="gm-field-grid">
              <Field label="Phone"><input className={fieldStyle} type="tel" autoComplete="tel" required value={form.phone} onChange={patch('phone')} /></Field>
              <Field label="Job title"><input className={fieldStyle} required maxLength={80} value={form.title} onChange={patch('title')} placeholder="e.g. Group host" /></Field>
            </div>
            <fieldset className="gm-staff-groups-fieldset">
              <legend>Assign groups to manage</legend>
              {!groups.length && <p className="gm-live-muted">Create groups from a promotional post before assigning staff.</p>}
              {groups.map(group => <label className="gm-staff-group-option" key={group.id}>
                <input type="checkbox" checked={form.groupIds.includes(group.id)} onChange={() => toggleGroup(group.id)} />
                <span><strong>{group.name}</strong><small>{group.location || group.address || 'Location not set'}</small></span>
              </label>)}
              {groups.length > 0 && !form.groupIds.length && <small className="gm-staff-form-hint">Select at least one group.</small>}
            </fieldset>
            <div className="gm-location-form-actions"><PillButton type="submit" disabled={!groups.length || !form.groupIds.length}>{editingId ? 'Save staff details' : 'Send for admin approval'}</PillButton>{editingId && <button type="button" className="gm-text-action" onClick={reset}>Cancel edit</button>}</div>
            {message && <p className="gm-location-message" role="status">{message}</p>}
          </form>
        </section>

        <section className="gm-panel gm-live-panel gm-staff-list-panel">
          <div className="gm-panel-heading"><div><span className="gm-eyebrow">ACCESS REQUESTS</span><h3>Staff accounts</h3></div><span className="gm-group-count">{accounts.length} accounts</span></div>
          {!accounts.length && <div className="gm-staff-empty"><Icon name="users" size={24} /><strong>No staff accounts yet</strong><span>Create a staff request to assign group management.</span></div>}
          <div className="gm-staff-list">{accounts.map(account => <article className="gm-staff-row" key={account.id}>
            <div className="gm-staff-avatar">{account.name.split(/\s+/).map(part => part[0]).slice(0, 2).join('').toUpperCase()}</div>
            <div className="gm-staff-main"><div className="gm-staff-name-line"><strong>{account.name}</strong><span className="gm-staff-approval-status"><i />{account.status || pendingApproval}</span></div><span>{account.title} · {account.email} · {account.phone}</span>
              <div className="gm-staff-assigned-groups">{account.groupIds.map(id => <span key={id}>{groupName(id)}</span>)}</div>
            </div>
            <div className="gm-staff-actions"><button type="button" className="gm-text-action" onClick={() => edit(account)}>Edit</button><button type="button" className="gm-text-action gm-delete-action" onClick={() => onDelete(account.id)} aria-label={`Remove ${account.name}`} title="Remove staff account"><Icon name="close" size={15} /></button></div>
          </article>)}</div>
          <div className="gm-staff-approval-note"><Icon name="shield" size={15} /><span>Minh reviews business staff account requests before access is granted.</span></div>
        </section>
      </div>
    </div>
  );
}
