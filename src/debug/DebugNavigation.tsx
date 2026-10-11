import { OfflineStatus } from '../components/OfflineStatus';
import '../styles/debug-navigation.css';

export function DebugNavigation({ current }: { current: 'menu' | 'answers' | 'positions' }) {
  return <div className="debug-navigation">
    <nav aria-label="Navegação do debug">
      <a href="./index.html" aria-current={current === 'menu' ? 'page' : undefined}>Menu debug</a>
      <a href="./gabarito.html" aria-current={current === 'answers' ? 'page' : undefined}>Respostas dos casos</a>
      <a href="./positions.html" aria-current={current === 'positions' ? 'page' : undefined}>Posições do DNA</a>
    </nav>
    <OfflineStatus />
  </div>;
}
