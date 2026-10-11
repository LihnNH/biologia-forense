export interface Position { x: number; y: number; z: number }
export interface SavedPoint { id: number; position: Position }

// Same numbered hotspots as the 3D model, relative to the static image.
export const hotspotImagePositions = [
  { x: 0.403, y: 0.447341 },
  { x: 0.513, y: 0.420525 },
  { x: 0.664, y: 0.590998 },
  { x: 0.643, y: 0.665699 },
  { x: 0.702, y: 0.636968 },
  { x: 0.678, y: 0.698261 },
];

export const hotspotPositions = [
  { x: -125.941251, y: -37.733574, z: 50.930829 },
  { x: 241.141003, y: 93.502434, z: 184.378981 },
  { x: 262.590476, y: -104.293982, z: 141.683166 },
  { x: 412.229906, y: 37.50347, z: 303.015262 },
  { x: 479.469135, y: -97.098149, z: 174.914187 },
  { x: 62.400719, y: 226.58071, z: -45.527808 }
];
export const hotspotDetails = [
  {
    title: 'Base Nitrogenada',
    text: 'As bases nitrogenadas são estruturas químicas que armazenam as informações genéticas. Elas ficam na parte interna do DNA, ligando as duas fitas da molécula como os degraus de uma escada. Existem quatro bases: adenina, timina, citosina e guanina. A adenina sempre se liga à timina, enquanto a citosina se liga à guanina.'
  },
  {
    title: 'Adenina',
    text: 'A adenina é uma base nitrogenada que se liga à timina no DNA.'
  },
  {
    title: 'Timina',
    text: 'A timina é uma base nitrogenada que se liga à adenina no DNA.'
  },
  {
    title: 'Citosina',
    text: 'A citosina é uma base nitrogenada que se liga à guanina no DNA.'
  },
  {
    title: 'Guanina',
    text: 'A guanina é uma base nitrogenada que se liga à citosina no DNA.'
  },
  {
    title: 'Esqueleto de açúcar-fosfato',
    text: 'A parte azul representa a estrutura externa do DNA, formada pela alternância entre moléculas de açúcar, chamadas desoxirribose, e grupos fosfato. Ela sustenta a dupla hélice e mantém as bases nitrogenadas organizadas em seu interior.'
  }
];
export const hotspots = hotspotPositions.map((position, index) => ({
  id: index + 1,
  position,
  ...hotspotDetails[index]
}));
