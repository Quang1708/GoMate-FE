import ConnectedPortal from '../gomate-portal/ConnectedPortal';
import DemoHub from '../gomate-portal/DemoHub';
import { LanguageProvider, useLanguage } from '../i18n/LanguageContext';
function PortalWorkspace() {
  const { language, setLanguage } = useLanguage();
  return <><div style={{ position: 'fixed', right: 20, bottom: 20, zIndex: 1000, padding: '8px 12px', background: 'white', border: '1px solid #dedbea', borderRadius: 20, boxShadow: '0 4px 20px #0002' }}>
    <label htmlFor="portal-language" style={{ fontSize: 13, marginRight: 8 }}>{language === 'vi' ? 'Ngôn ngữ' : 'Language'}</label>
    <select id="portal-language" value={language} onChange={event => setLanguage(event.target.value === 'en' ? 'en' : 'vi')} style={{ border: 0, background: 'transparent', padding: 4 }}><option value="vi">Tiếng Việt</option><option value="en">English</option></select>
  </div><ConnectedPortal /></>;
}
export function WebWorkspace({ mode }: { mode: 'portal' | 'demo' }) { return <LanguageProvider>{mode === 'portal' ? <PortalWorkspace /> : <DemoHub />}</LanguageProvider>; }
