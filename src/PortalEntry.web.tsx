import { GoMatePortal } from './gomate-portal/ConnectedPortal';
import { LanguageProvider } from './i18n/LanguageContext';

export default function PortalEntry() {
  return <LanguageProvider><GoMatePortal /></LanguageProvider>;
}
