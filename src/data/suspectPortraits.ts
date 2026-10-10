import type { CaseId } from './cases';
import rafael from '../../assets/casos-webp/lamina-sombria/rafael-oliveira.webp';
import mariana from '../../assets/casos-webp/lamina-sombria/mariana-costa.webp';
import diego from '../../assets/casos-webp/lamina-sombria/diego-martins.webp';
import patricia from '../../assets/casos-webp/lamina-sombria/patricia-alves.webp';
import bruno from '../../assets/casos-webp/lamina-sombria/bruno-santos.webp';
import ricardo from '../../assets/casos-webp/ultimo-gole/ricardo-gomes.webp';
import vanessa from '../../assets/casos-webp/ultimo-gole/vanessa-ribeiro.webp';
import marceloSilva from '../../assets/casos-webp/ultimo-gole/marcelo-silva.webp';
import juliana from '../../assets/casos-webp/ultimo-gole/juliana-costa.webp';
import gustavo from '../../assets/casos-webp/ultimo-gole/gustavo-almeida.webp';
import joao from '../../assets/casos-webp/impacto-fatal/joao-batista.webp';
import carlos from '../../assets/casos-webp/impacto-fatal/carlos-henrique.webp';
import marceloLima from '../../assets/casos-webp/impacto-fatal/marcelo-lima.webp';
import renata from '../../assets/casos-webp/impacto-fatal/renata-souza.webp';
import laura from '../../assets/casos-webp/impacto-fatal/laura-almeida.webp';
import helena from '../../assets/casos-webp/no-mortal/helena-martins.webp';
import marcos from '../../assets/casos-webp/no-mortal/marcos-vinicius.webp';
import tereza from '../../assets/casos-webp/no-mortal/tereza.webp';
import sebastiao from '../../assets/casos-webp/no-mortal/sebastiao.webp';

export const suspectPortraits: Record<CaseId, Record<string, string>> = {
  Faca: {
    'Rafael Oliveira': rafael,
    'Mariana Costa': mariana,
    'Diego Martins': diego,
    'Patrícia Alves': patricia,
    'Bruno Santos': bruno,
  },
  Veneno: {
    'Ricardo Gomes': ricardo,
    'Vanessa Ribeiro': vanessa,
    'Marcelo Silva': marceloSilva,
    'Juliana Costa': juliana,
    'Gustavo Almeida': gustavo,
  },
  Martelo: {
    'João Batista': joao,
    'Carlos Henrique': carlos,
    'Marcelo Lima': marceloLima,
    'Renata Souza': renata,
    'Laura Almeida': laura,
  },
  Corda: {
    'Helena Martins': helena,
    'Marcos Vinícius': marcos,
    Tereza: tereza,
    'Sebastião': sebastiao,
  },
};
