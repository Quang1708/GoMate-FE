import ConnectedPortal from '../gomate-portal/ConnectedPortal';
import DemoHub from '../gomate-portal/DemoHub';
export function WebWorkspace({ mode }: { mode: 'portal' | 'demo' }) { return mode === 'portal' ? <ConnectedPortal /> : <DemoHub />; }
