import type { RefObject } from 'react';
import { artwork } from '../data/assets';
import { hotspotImagePositions } from '../data/dna';
import { useI18n } from '../i18n/I18n';

export function DnaFallback({ imageRef, selectedHotspot, onSelect }: {
  imageRef: RefObject<HTMLImageElement | null>;
  selectedHotspot: number | null;
  onSelect: (id: number) => void;
}) {
  const { t, hotspots } = useI18n();
  return <div className="dna-webgl-fallback" id="dna-webgl-fallback">
    <div className="dna-static-map">
      <img ref={imageRef} draggable={false} className="dna-static-image" src={artwork.dnaStatic} alt={t('dna2dLabel')} />
      {hotspots.map((hotspot, index) => <button type="button" className="dna-image-point" key={hotspot.id}
        style={{ left: `${hotspotImagePositions[index].x * 100}%`, top: `${hotspotImagePositions[index].y * 100}%` }}
        aria-label={`${t('key', { number: hotspot.id })}: ${hotspot.title}`} aria-pressed={selectedHotspot === hotspot.id}
        onClick={() => onSelect(hotspot.id)}>{hotspot.id}</button>)}
    </div>
  </div>;
}
