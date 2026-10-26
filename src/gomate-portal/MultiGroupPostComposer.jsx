import { usePortalText } from './usePortalText';
import { useRef, useState } from 'react';
import { Icon, PillButton, StatusPill } from './GoMatePortal';

const fieldStyle = 'gm-simple-input';

function Field({ label, children }) {
  const t = usePortalText();
  return <label className="gm-field"><span>{t(label)}</span>{children}</label>;
}

function localDateTime(daysAhead, hour) {
  const date = new Date(Date.now() + daysAhead * 86400000);
  date.setHours(hour, 0, 0, 0);
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
}

function createGroup(index, locations) {
  const location = locations[index % Math.max(locations.length, 1)];
  const startsAt = localDateTime(2 + index, 9 + (index % 2) * 4);
  const endsAt = localDateTime(2 + index, 11 + (index % 2) * 4);
  return {
    id: `group-draft-${Date.now()}-${index}`,
    name: `Group ${String(index + 1).padStart(2, '0')}`,
    category: 'Workshop',
    locationId: location?.id || '',
    location: location?.address || '',
    meetingPoint: location?.name || '',
    startsAt,
    endsAt,
    maxParticipants: 12,
    estimatedCost: 100000,
    depositAmount: 0,
  };
}

export default function MultiGroupPostComposer({ locations, onPublish, busy }) {
  const t = usePortalText();
  const [promo, setPromo] = useState({ title: '', copy: '', discountPercent: 20, offer: '', offerTerms: '' });
  const [groups, setGroups] = useState(() => [createGroup(0, locations), createGroup(1, locations)]);
  const nextGroupNumber = useRef(2);

  const patchPromo = key => event => setPromo(value => ({ ...value, [key]: event.target.value }));
  const patchGroup = (id, key, value) => setGroups(current => current.map(group => group.id === id ? { ...group, [key]: value } : group));
  const selectLocation = (group, locationId) => {
    const location = locations.find(item => item.id === locationId);
    setGroups(current => current.map(item => item.id === group.id ? {
      ...item,
      locationId,
      location: location?.address || '',
      meetingPoint: location?.name || '',
    } : item));
  };
  const addGroup = () => {
    const number = nextGroupNumber.current++;
    setGroups(current => [...current, createGroup(number, locations)]);
  };
  const removeGroup = id => setGroups(current => current.length > 2 ? current.filter(group => group.id !== id) : current);
  const submit = event => {
    event.preventDefault();
    onPublish({
      promo: { ...promo, discountPercent: Number(promo.discountPercent) },
      groups: groups.map(group => ({
        ...group,
        maxParticipants: Number(group.maxParticipants),
        estimatedCost: Number(group.estimatedCost),
        depositAmount: Number(group.depositAmount),
      })),
    });
  };

  return (
    <form className="gm-auth-form gm-multi-post-form" onSubmit={submit}>
      <section className="gm-promo-section">
        <div className="gm-business-section-heading">
          <span className="gm-business-step">01</span>
          <div><h4>{t("Main promotional post")}</h4><p>{t("One offer and description shared across every group.")}</p></div>
        </div>
        <Field label={t("Post title")}><input className={fieldStyle} required minLength={3} maxLength={120} value={promo.title} onChange={patchPromo('title')} placeholder={t("e.g. Luma Weekend Social")} /></Field>
        <Field label={t("Post description")}><textarea className={fieldStyle + ' gm-textarea'} required maxLength={3000} value={promo.copy} onChange={patchPromo('copy')} placeholder={t("Describe the promotion for your community.")} /></Field>
        <div className="gm-field-grid">
          <Field label={t("Discount (%)")}><input type="number" className={fieldStyle} min={0} max={100} value={promo.discountPercent} onChange={patchPromo('discountPercent')} /></Field>
          <Field label={t("Offer")}><input className={fieldStyle} maxLength={200} value={promo.offer} onChange={patchPromo('offer')} placeholder={t("e.g. Welcome drink")} /></Field>
        </div>
        <Field label={t("Offer terms")}><textarea className={fieldStyle + ' gm-textarea gm-compact-textarea'} maxLength={500} value={promo.offerTerms} onChange={patchPromo('offerTerms')} placeholder={t("Optional conditions")} /></Field>
      </section>

      <section className="gm-generated-groups-section">
        <div className="gm-business-section-heading gm-groups-heading">
          <span className="gm-business-step">02</span>
          <div><h4>{t("Groups generated from this post")}</h4><p>{t("Configure each event separately. Minimum two groups.")}</p></div>
          <span className="gm-group-count">{t(groups.length)} {t(" groups")}</span>
        </div>
        <div className="gm-generated-groups">
          {groups.map((group, index) => <article className="gm-generated-group" key={group.id}>
            <div className="gm-generated-group-heading">
              <span className="gm-group-number">{t(String(index + 1).padStart(2, '0'))}</span>
              <div><h5>{group.name}</h5><span>{t("Separate GoMate group")}</span></div>
              {groups.length > 2 && <button type="button" className="gm-text-action gm-remove-group" onClick={() => removeGroup(group.id)} aria-label={t(`Remove ${group.name}`)} title={t("Remove group")}><Icon name="close" size={16} /></button>}
            </div>
            <div className="gm-field-grid">
              <Field label={t("Group name")}><input className={fieldStyle} required maxLength={100} value={group.name} onChange={event => patchGroup(group.id, 'name', event.target.value)} /></Field>
              <Field label={t("Category")}><select className={fieldStyle} value={group.category} onChange={event => patchGroup(group.id, 'category', event.target.value)}>{['Workshop', 'Cà phê', 'Thể thao', 'Du lịch', 'Âm nhạc', 'Nghệ thuật', 'Networking'].map(value => <option key={value}>{t(value)}</option>)}</select></Field>
            </div>
            <Field label={t("Quick Select Location")}>
              <select className={fieldStyle} required value={group.locationId} onChange={event => selectLocation(group, event.target.value)}>
                <option value="" disabled>{t("Choose a saved branch")}</option>
                {locations.map(location => <option key={location.id} value={location.id}>{location.name} {t(" · ")}{t(location.city)}</option>)}
              </select>
            </Field>
            {!locations.length && <p className="gm-group-location-empty">{t("Add a branch in Location Library before creating groups.")}</p>}
            <div className="gm-group-location-summary"><Icon name="grid" size={14} /><span>{t(group.location || 'No saved location selected')}</span></div>
            <div className="gm-field-grid gm-group-schedule">
              <Field label={t("Starts")}><input className={fieldStyle} type="datetime-local" required value={group.startsAt} onChange={event => patchGroup(group.id, 'startsAt', event.target.value)} /></Field>
              <Field label={t("Ends")}><input className={fieldStyle} type="datetime-local" required value={group.endsAt} onChange={event => patchGroup(group.id, 'endsAt', event.target.value)} /></Field>
            </div>
            <div className="gm-field-grid gm-group-money">
              <Field label={t("Capacity")}><input className={fieldStyle} type="number" min={2} max={1000} required value={group.maxParticipants} onChange={event => patchGroup(group.id, 'maxParticipants', event.target.value)} /></Field>
              <Field label={t("Estimated cost / person (VND)")}><input className={fieldStyle} type="number" min={0} required value={group.estimatedCost} onChange={event => patchGroup(group.id, 'estimatedCost', event.target.value)} /></Field>
              <Field label={t("Tiền cọc / person (VND)")}><input className={fieldStyle} type="number" min={0} max={group.estimatedCost || 0} required value={group.depositAmount} onChange={event => patchGroup(group.id, 'depositAmount', event.target.value)} /></Field>
            </div>
          </article>)}
        </div>
        <button type="button" className="gm-add-group-button" onClick={addGroup}><Icon name="plus" size={16} />{t("Add another group")}</button>
      </section>

      <div className="gm-multi-post-footer">
        <div><strong>{t("One post · ")}{t(groups.length)} {t(" groups")}</strong><span>{t("Each group has its own schedule, location, capacity, and deposit.")}</span></div>
        <PillButton type="submit" disabled={busy || locations.length === 0}>{t(busy ? 'Creating groups...' : `Create post and ${groups.length} groups`)}</PillButton>
      </div>
    </form>
  );
}
