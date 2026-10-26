import { usePortalText } from './usePortalText';
import { useMemo, useState } from 'react';
import { Icon, PillButton } from './GoMatePortal';

const fieldStyle = 'gm-simple-input';

const mockPlaces = [
  { id: 'place-1', name: 'Nguyen Hue Walking Street', address: '42 Nguyen Hue, Ben Nghe Ward', city: 'Ho Chi Minh City', latitude: 10.7737, longitude: 106.703, mapX: 54, mapY: 43 },
  { id: 'place-2', name: 'Thao Dien Community Hub', address: '12 Thao Dien Street, Thao Dien Ward', city: 'Ho Chi Minh City', latitude: 10.8031, longitude: 106.734, mapX: 73, mapY: 28 },
  { id: 'place-3', name: 'Da Nang Riverside', address: '88 Bach Dang Street, Hai Chau District', city: 'Da Nang', latitude: 16.0678, longitude: 108.2208, mapX: 42, mapY: 57 },
  { id: 'place-4', name: 'Hoan Kiem Lake', address: '1 Dinh Tien Hoang, Hoan Kiem District', city: 'Ha Noi', latitude: 21.0287, longitude: 105.8522, mapX: 62, mapY: 36 },
];

const emptyLocation = () => ({ id: '', name: '', address: '', city: 'Ho Chi Minh City', phone: '', latitude: '', longitude: '', mapX: 52, mapY: 46 });

export const initialBusinessLocations = [
  { id: 'loc-luma-d1', name: 'Luma Social Club - District 1', address: '15 Nguyen Hue, Ben Nghe Ward', city: 'Ho Chi Minh City', phone: '+84 28 3822 4100', latitude: 10.7739, longitude: 106.7033, mapX: 54, mapY: 43 },
  { id: 'loc-luma-thao-dien', name: 'Luma Social Club - Thao Dien', address: '12 Thao Dien Street, Thao Dien Ward', city: 'Ho Chi Minh City', phone: '+84 28 3744 8020', latitude: 10.8031, longitude: 106.734, mapX: 73, mapY: 28 },
];

export function useMapAPI() {
  const [query, setQuery] = useState('');
  const [pinnedPlace, setPinnedPlace] = useState(null);
  const results = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    if (!normalized) return [];
    return mockPlaces.filter(place => `${place.name} ${place.address} ${place.city}`.toLocaleLowerCase().includes(normalized)).slice(0, 5);
  }, [query]);

  const search = value => setQuery(value);
  const pin = place => setPinnedPlace(place);
  const pinMapPoint = (x, y) => {
    const point = { id: `pin-${Math.round(x)}-${Math.round(y)}`, name: 'Pinned map location', address: 'Pinned location, Ho Chi Minh City', city: 'Ho Chi Minh City', latitude: 10.77 + ((50 - y) / 180), longitude: 106.7 + ((x - 50) / 180), mapX: x, mapY: y };
    setPinnedPlace(point);
    return point;
  };

  return { query, search, results, pinnedPlace, pin, pinMapPoint };
}

function Field({ label, children }) {
  const t = usePortalText();
  return <label className="gm-field"><span>{t(label)}</span>{children}</label>;
}

export default function LocationLibrary({ locations, onSave, onDelete }) {
  const t = usePortalText();
  const [form, setForm] = useState(emptyLocation);
  const [message, setMessage] = useState('');
  const mapAPI = useMapAPI();

  const patch = key => event => setForm(value => ({ ...value, [key]: event.target.value }));
  const selectPlace = place => {
    mapAPI.pin(place);
    setForm(value => ({ ...value, address: place.address, city: place.city, latitude: place.latitude, longitude: place.longitude, mapX: place.mapX, mapY: place.mapY }));
    setMessage('');
  };
  const pinFromMap = event => {
    if (event.target.closest('button')) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = Math.round(((event.clientX - bounds.left) / bounds.width) * 100);
    const y = Math.round(((event.clientY - bounds.top) / bounds.height) * 100);
    const point = mapAPI.pinMapPoint(x, y);
    setForm(value => ({ ...value, address: point.address, city: point.city, latitude: point.latitude, longitude: point.longitude, mapX: point.mapX, mapY: point.mapY }));
  };
  const editLocation = location => {
    setForm({ ...emptyLocation(), ...location });
    mapAPI.pin(location);
    setMessage('');
  };
  const reset = ({ clearMessage = true } = {}) => {
    setForm(emptyLocation());
    mapAPI.pin(null);
    mapAPI.search('');
    if (clearMessage) setMessage('');
  };
  const submit = event => {
    event.preventDefault();
    const isEditing = Boolean(form.id);
    const location = { ...form, latitude: Number(form.latitude), longitude: Number(form.longitude) };
    onSave(location);
    reset({ clearMessage: false });
    setMessage(isEditing ? 'Location updated.' : 'Location added to the library.');
  };

  return (
    <div className="gm-location-library mx-auto w-full max-w-7xl">
      <div className="gm-location-toolbar">
        <div><span className="gm-eyebrow">{t("BUSINESS LOCATIONS")}</span><h3>{t("Saved locations ")}<span>{t(locations.length)}</span></h3></div>
        <PillButton icon="plus" onClick={reset}>{t("Add location")}</PillButton>
      </div>
      <div className="gm-location-layout">
        <section className="gm-panel gm-live-panel gm-location-editor">
          <div className="gm-panel-heading"><div><h3>{t(form.id ? 'Edit location' : 'New location')}</h3><p className="gm-live-muted">{t("Branch details")}</p></div></div>
          <form className="gm-auth-form" onSubmit={submit}>
            <Field label={t("Location name")}><input className={fieldStyle} value={form.name} required maxLength={120} onChange={patch('name')} placeholder={t("e.g. Luma Social Club - District 1")} /></Field>
            <Field label={t("Search address")}>
              <div className="gm-map-search"><Icon name="search" size={16} /><input value={mapAPI.query} onChange={event => mapAPI.search(event.target.value)} placeholder={t("Search a place or address")} autoComplete="off" /></div>
              {mapAPI.results.length > 0 && <div className="gm-map-results" role="listbox">{mapAPI.results.map(place => <button key={place.id} type="button" role="option" onClick={() => selectPlace(place)}><strong>{place.name}</strong><span>{place.address} {t(" · ")}{t(place.city)}</span></button>)}</div>}
            </Field>
            <Field label={t("Detailed address")}><textarea className={fieldStyle + ' gm-textarea'} value={form.address} required maxLength={300} onChange={patch('address')} placeholder={t("Street, ward, district, city")} /></Field>
            <div className="gm-field-grid">
              <Field label={t("City")}><input className={fieldStyle} value={form.city} required maxLength={100} onChange={patch('city')} /></Field>
              <Field label={t("Contact phone")}><input className={fieldStyle} type="tel" value={form.phone} onChange={patch('phone')} /></Field>
            </div>
            <div className="gm-location-coordinates"><span>{t(mapAPI.pinnedPlace ? 'Pinned coordinates' : 'Map pin')}</span><strong>{t(form.latitude ? `${Number(form.latitude).toFixed(4)}, ${Number(form.longitude).toFixed(4)}` : 'Select a search result or pin the map')}</strong></div>
            <div className="gm-location-form-actions"><PillButton type="submit" icon={form.id ? 'check' : 'plus'}>{t(form.id ? 'Save changes' : 'Add location')}</PillButton>{form.id && <button type="button" className="gm-text-action" onClick={reset}>{t("Cancel edit")}</button>}</div>
            {message && <p className="gm-location-message" role="status">{t(message)}</p>}
          </form>
        </section>

        <section className="gm-panel gm-live-panel gm-location-map-panel">
          <div className="gm-panel-heading"><div><span className="gm-eyebrow">{t("MAP")}</span><h3>{t("Location pin")}</h3></div><span className="gm-map-provider">{t("Mock Map API")}</span></div>
          <div className="gm-map-stage" role="application" aria-label={t("Location map; click to place a pin")} onClick={pinFromMap}>
            <div className="gm-map-block gm-map-block--one" /><div className="gm-map-block gm-map-block--two" /><div className="gm-map-block gm-map-block--three" />
            <div className="gm-map-road gm-map-road--one" /><div className="gm-map-road gm-map-road--two" /><div className="gm-map-road gm-map-road--three" />
            <span className="gm-map-label gm-map-label--one">{t("RIVERSIDE")}</span><span className="gm-map-label gm-map-label--two">{t("CITY CENTER")}</span>
            {locations.map(location => <button key={location.id} type="button" className="gm-map-marker gm-map-marker--saved" style={{ left: `${location.mapX || 50}%`, top: `${location.mapY || 50}%` }} aria-label={t(`Edit ${location.name}`)} onClick={event => { event.stopPropagation(); editLocation(location); }} />)}
            {mapAPI.pinnedPlace && <span className="gm-map-marker gm-map-marker--active" style={{ left: `${mapAPI.pinnedPlace.mapX || form.mapX}%`, top: `${mapAPI.pinnedPlace.mapY || form.mapY}%` }} />}
            <div className="gm-map-scale"><span />{t("1 km")}</div>
          </div>
          <div className="gm-map-caption"><span className="gm-map-legend gm-map-legend--saved" />{t("Saved locations ")}<span className="gm-map-legend gm-map-legend--active" />{t("Current pin")}</div>
          <div className="gm-location-list-heading"><h3>{t("Location library")}</h3><span>{t(locations.length)} {t(" branches")}</span></div>
          <div className="gm-location-list">{locations.length ? locations.map(location => <article className="gm-location-row" key={location.id}>
            <div className="gm-location-row-pin" aria-hidden="true">{t(String(location.name).slice(0, 1).toUpperCase())}</div>
            <div className="gm-location-row-copy"><strong>{location.name}</strong><span>{location.address}, {t(location.city)}</span>{location.phone && <small>{t(location.phone)}</small>}</div>
            <button type="button" className="gm-text-action" onClick={() => editLocation(location)}>{t("Edit")}</button>
            <button type="button" className="gm-text-action gm-delete-action" onClick={() => onDelete(location.id)} aria-label={t(`Delete ${location.name}`)} title={t("Delete location")}><Icon name="close" size={15} /></button>
          </article>) : <p className="gm-location-empty">{t("No saved locations yet.")}</p>}</div>
        </section>
      </div>
    </div>
  );
}
