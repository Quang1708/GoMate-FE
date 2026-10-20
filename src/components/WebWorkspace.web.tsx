import PartnerPortal from '../gomate-portal/PartnerPortal';
import DemoHub from '../gomate-portal/DemoHub';
export function WebWorkspace({ mode }: { mode: 'portal' | 'demo' }) { return mode === 'portal' ? <PartnerPortal /> : <DemoHub />; }
