import type { CSSProperties } from 'react';

export function DnaFallback({ message }: { message: string }) {
  return <div className="dna-webgl-fallback" id="dna-webgl-fallback" role="img" aria-label="Representação bidimensional animada de uma molécula de DNA">
    <div className="helix" aria-hidden="true">
      {['AT', 'CG', 'GC', 'TA', 'AT', 'CG'].map((pair, index) => <div key={index} className="helix-rung" style={{ top: 7 + index * 45, '--delay': `${index * -.3}s` } as CSSProperties}>
        <span className="base left">{pair[0]}</span><span className="base right">{pair[1]}</span>
      </div>)}
    </div>
    <p className="dna-fallback-copy"><strong>Visualização 2D do DNA</strong><span id="dna-fallback-message">{message}</span></p>
  </div>;
}
