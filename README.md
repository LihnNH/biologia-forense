# Feira de Ciências 2026

Verificador de DNA em React + TypeScript + Vite. Os quatro casos, depoimentos,
soluções, estilos responsivos e animações do protótipo foram preservados.

## Comandos

```sh
npm install
npm run dev
npm run build
npm run preview
```

- `dev`: inicia o servidor de desenvolvimento; use o endereço exibido no terminal.
- `build`: gera a versão de produção em `dist/`, incluindo os recursos de `assets/`.
- `preview`: serve o último build para conferência local.

A aplicação está disponível em `/` e em `/trabalho.html`, para manter o endereço antigo.

## Verificação

```sh
npm run typecheck
npm test
```

- `typecheck`: verifica os tipos sem gerar arquivos. Também é executado pelo build.
- `test`: gera o build e executa os testes de navegador com Playwright e Microsoft Edge.
  O Edge deve estar instalado; o servidor de preview é iniciado automaticamente.

## Organização

- `src/components/`: telas, cards, fundo, formulário, modais e visualizador de DNA.
- `src/lib/useInvestigation.ts`: estado da investigação e confirmação automática.
- `src/lib/dnaScene.ts`: cena Three.js, carregamento GLB, controles e limpeza de recursos.
- `src/data/`: textos dos casos, soluções, ícones e pontos de interesse do DNA.
- `src/styles/`: estilos da aplicação e das páginas de apoio.
- `src/debug/`: componentes React das páginas de apoio.
- `assets/`: SVGs e o modelo `dna.glb`; o Vite processa os arquivos utilizados.
- `tests/`: navegação, quatro soluções, erros de palpite, teclado, código, DNA e layout mobile.

Three.js, GLTFLoader, marked e fontes Inter/Bebas Neue vêm dos pacotes npm.
O modelo 3D é carregado diretamente do arquivo GLB; não há cópia em base64
nem dependência de scripts ou fontes de `vendor`.

O visualizador é carregado ao abrir a explicação do DNA. Arraste para girar,
use a roda do mouse ou `+`/`-` para aproximar e as setas para girar pelo teclado.
As teclas `1` a `6` mostram os pontos explicativos; `L` abre a licença.
Quando a aceleração 3D ou o carregamento do modelo falha, a hélice 2D é exibida.

## Páginas de apoio

- `/debug/gabarito.html`: soluções e códigos dos quatro casos.
- `/debug/positions.html`: seleção de posições no modelo e cópia das coordenadas em JSON.

Essas páginas também fazem parte do build.

## Licença do modelo

O modelo [DNA](https://skfb.ly/onW7w), de LucasPresoto, usa a licença
[Creative Commons Atribuição 4.0 Internacional](https://creativecommons.org/licenses/by/4.0/).
