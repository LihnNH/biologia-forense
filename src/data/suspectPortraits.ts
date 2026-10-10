import type { CaseId } from './cases';
import rafael from '../../assets/casos/lamina-sombria/rafael-oliveira.png';
import mariana from '../../assets/casos/lamina-sombria/mariana-costa.png';
import diego from '../../assets/casos/lamina-sombria/diego-martins.png';
import patricia from '../../assets/casos/lamina-sombria/patricia-alves.png';
import bruno from '../../assets/casos/lamina-sombria/bruno-santos.png';
import ricardo from '../../assets/casos/ultimo-gole/ricardo-gomes.png';
import vanessa from '../../assets/casos/ultimo-gole/vanessa-ribeiro.png';
import marceloSilva from '../../assets/casos/ultimo-gole/marcelo-silva.png';
import juliana from '../../assets/casos/ultimo-gole/juliana-costa.png';
import gustavo from '../../assets/casos/ultimo-gole/gustavo-almeida.png';
import joao from '../../assets/casos/impacto-fatal/joao-batista.png';
import carlos from '../../assets/casos/impacto-fatal/carlos-henrique.png';
import marceloLima from '../../assets/casos/impacto-fatal/marcelo-lima.png';
import renata from '../../assets/casos/impacto-fatal/renata-souza.png';
import laura from '../../assets/casos/impacto-fatal/laura-almeida.png';
import helena from '../../assets/casos/no-mortal/helena-martins.png';
import marcos from '../../assets/casos/no-mortal/marcos-vinicius.png';
import tereza from '../../assets/casos/no-mortal/tereza.png';
import sebastiao from '../../assets/casos/no-mortal/sebastiao.png';

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
