import type { CaseId } from './cases';
import rafael from '../../assets/texto-suspeitos/lamina-sombria/rafael-oliveira_cursivo.png';
import mariana from '../../assets/texto-suspeitos/lamina-sombria/mariana-costa_cursivo.png';
import diego from '../../assets/texto-suspeitos/lamina-sombria/diego-martins_cursivo.png';
import patricia from '../../assets/texto-suspeitos/lamina-sombria/patricia-alves_cursivo.png';
import bruno from '../../assets/texto-suspeitos/lamina-sombria/bruno-santos_cursivo.png';
import ricardo from '../../assets/texto-suspeitos/ultimo-gole/ricardo-gomes_cursivo.png';
import vanessa from '../../assets/texto-suspeitos/ultimo-gole/vanessa-ribeiro_cursivo.png';
import marceloSilva from '../../assets/texto-suspeitos/ultimo-gole/marcelo-silva_cursivo.png';
import juliana from '../../assets/texto-suspeitos/ultimo-gole/juliana-costa_cursivo.png';
import gustavo from '../../assets/texto-suspeitos/ultimo-gole/gustavo-almeida_cursivo.png';
import joao from '../../assets/texto-suspeitos/impacto-fatal/joao-batista_cursivo.png';
import carlos from '../../assets/texto-suspeitos/impacto-fatal/carlos-henrique_cursivo.png';
import marceloLima from '../../assets/texto-suspeitos/impacto-fatal/marcelo-lima_cursivo.png';
import renata from '../../assets/texto-suspeitos/impacto-fatal/renata-souza_cursivo.png';
import laura from '../../assets/texto-suspeitos/impacto-fatal/laura-almeida_cursivo.png';
import helena from '../../assets/texto-suspeitos/no-mortal/helena-martins_cursivo.png';
import marcos from '../../assets/texto-suspeitos/no-mortal/marcos-vinicius_cursivo.png';
import tereza from '../../assets/texto-suspeitos/no-mortal/tereza_cursivo.png';
import sebastiao from '../../assets/texto-suspeitos/no-mortal/sebastiao_cursivo.png';

export const suspectNameImages: Record<CaseId, Record<string, string>> = {
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
