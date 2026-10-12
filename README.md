# Feira de Ciências 2026

Verificador de DNA em React + TypeScript + Vite. Cada caso abre uma galeria
com as fotos dos suspeitos, com acesso ao palpite. Os retratos são apenas
ilustrativos por enquanto; depoimentos, soluções e animações continuam disponíveis.

## Comandos

```sh
npm install
npm run dev
npm run build
npm run preview
npm run optimize:portraits
```

- `dev`: inicia o servidor de desenvolvimento; use o endereço exibido no terminal.
- `build`: gera a versão de produção em `dist/`, incluindo os recursos de `assets/`.
- `preview`: serve o último build para conferência local.
- `optimize:portraits`: gera WebP de até 480 px em `assets/casos-webp/`, preservando os PNGs originais.

Ao entrar, uma tela com progresso prepara as fontes, todos os SVGs e retratos,
o modelo GLB, suas texturas e os shaders do DNA. As imagens ficam decodificadas
em memória, e a cena 3D é mantida pronta, sem animação enquanto estiver oculta.
Falhas de imagens/fontes permitem tentar novamente ou continuar; se o 3D falhar,
a aplicação utiliza a representação 2D.

A aplicação está disponível em `/` e em `/trabalho.html`, para manter o endereço antigo.

Pressione `H` para abrir a ajuda da tela inicial, dos suspeitos ou do código.
O botão redondo **?**, no canto inferior direito dessas telas, abre a mesma ajuda.
Somente a ajuda inicial inclui a lista de atalhos, com teclas no estilo do gabarito.
Ela orienta o uso do panfleto da feira, a escolha do suspeito e a leitura do código
com a lanterna UV e o cartaz. `H`, `Escape` ou **Entendi** fecham a ajuda.
O atalho também funciona nos campos do código, preservando as letras digitadas.
Não há ajuda nas configurações, no DNA, no debug ou na solução do caso.

## Uso offline na feira

Na versão publicada, um service worker salva automaticamente o build completo
no Cache Storage do navegador: páginas, scripts, fontes, fotos, nomes dos suspeitos,
imagens do finale e modelo de DNA. Não é preciso instalar um aplicativo/PWA.

Antes da feira, abra o site com internet no navegador que será usado e confira
**Pronto para usar offline** nas configurações (`C`). O mesmo indicador aparece
no debug. Só aparece depois que todos os arquivos foram salvos e o service worker
assumiu o controle da página. Se algum download falhar, use **Tentar novamente**.

Depois disso, o site e o debug continuam funcionando se a conexão cair, inclusive
ao recarregar ou abrir outra aba. O botão das configurações continua sendo o único
acesso ao debug no site principal. Dentro do debug, os links permitem alternar
entre o menu, as respostas e as posições do DNA sem depender da rede. Os arquivos
das três páginas são preparados mesmo se você ainda não tiver visitado os modos.

O cache fica nesse navegador e nesse endereço; não apague os dados do site antes
da feira. Uma primeira visita sem internet não consegue preparar os arquivos.
Ao terminar, **Apagar dados offline** nas configurações remove o cache offline,
o service worker e as preferências do site em `localStorage` e `sessionStorage`.
A limpeza também suspende o preparo nas abas abertas do debug. Depois de aparecer
**Dados offline apagados**, feche todas as abas do site e do debug; uma nova visita
com internet prepara os arquivos novamente. Cache HTTP e histórico comuns do
navegador são gerenciados pelo próprio navegador.
Para testar localmente, use `npm run build` e `npm run preview`; abrir o HTML
diretamente ou usar `npm run dev` não ativa o service worker.

Cada build tem uma versão própria. Atualizações são preparadas em segundo plano
e entram em uso quando todas as abas da versão anterior forem fechadas, preservando
as investigações em andamento. Depois de uma publicação, abra o site com internet,
aguarde o preparo, feche as abas do site/debug e abra novamente antes de conferir
o indicador para a feira.

O código correto libera a solução do caso mesmo quando o suspeito escolhido está
errado. Nesse caso, a tela final avisa que o palpite estava incorreto e mostra o
culpado real. Código errado não libera a solução; a mensagem pede para revisar
o código. Ao fechar o aviso, a pessoa volta aos suspeitos com o palpite anterior
ainda marcado e pode tentar outro código.

Nos campos do código, as setas esquerda/direita passam entre as quatro letras e
selecionam a letra do campo para permitir sua substituição. Backspace em um campo
vazio apaga a letra anterior.

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
- `src/offline/` e `src/lib/offline.ts`: cache versionado do build e preparo offline.
- `assets/`: SVGs e o modelo `dna.glb`; o Vite processa os arquivos utilizados.
- `assets/casos/`: fotos dos suspeitos, separadas por caso, exibidas sem corte na galeria.
- `assets/casos-webp/`: versões leves utilizadas pela aplicação; os originais não entram no build.
- `tests/`: navegação, quatro soluções, erros de palpite, teclado, código, DNA e layout mobile.

Three.js, GLTFLoader, marked e fontes Inter/Bebas Neue vêm dos pacotes npm.
O modelo 3D é carregado diretamente do arquivo GLB; não há cópia em base64
nem dependência de scripts ou fontes de `vendor`.

O visualizador é preparado durante o carregamento inicial. Arraste para girar,
use a roda do mouse ou `+`/`-` para aproximar e as setas para girar pelo teclado.
As teclas `1` a `6` mostram os pontos explicativos; `L` abre a licença.
Quando a aceleração 3D ou o carregamento do modelo falha, a imagem 2D é exibida.
O fallback usa `assets/dna-static-image.png`, com seis pontos fixos em coordenadas
relativas à imagem. As teclas `1` a `6` ou um clique no ponto mostram os mesmos
títulos, descrições e painéis animados do 3D. Pressionar a mesma tecla novamente
fecha a explicação. Os pontos e suas linhas continuam alinhados ao redimensionar.

## Estatísticas da feira

Ao escolher um caso na tela inicial, informe o tamanho do grupo e confirme em
**Iniciar caso**. O campo aceita números inteiros pelo teclado, botões `−`/`+`
ou setas para cima/baixo, sem limite numérico. Usar `0` permite testar o caso
sem somar visitantes, grupos, escolhas de caso ou soluções. Cancelar também
não altera os totais; voltar dos códigos aos suspeitos não registra outro grupo.

No fim das configurações (`C`), **Estatísticas da feira** mostra visitantes,
grupos atendidos, casos solucionados e a distribuição dos casos escolhidos.
As barras ficam divididas entre escolhas e soluções por caso, separadas por
uma linha central. Dados anteriores sem soluções por caso mantêm o total
geral; a distribuição das soluções começa em zero, sem estimativas.
Cada grupo registrado pode somar uma solução ao concluir o caso, inclusive se
o código estiver correto e o palpite errado. Erros de código não somam soluções.

**Exportar JSON** baixa os totais, escolhas e soluções por caso, com a data da exportação.
Os contadores no arquivo são strings decimais para preservar números grandes
sem perder precisão. Exportar não modifica os dados armazenados.
A seção `grupos`, apenas no JSON, lista o número e a quantidade de visitantes
de cada grupo registrado. Rodadas com `0` ficam fora da lista. O histórico
começa com os novos registros; tamanhos de grupos antigos não são estimados.

Os totais ficam neste navegador: `visitantes_totais` guarda a soma de visitantes
e `forensic-fair-statistics` guarda os outros contadores. Funcionam offline e
permanecem após recarregar; abas da mesma origem compartilham a contagem.
**Apagar dados offline** também remove todas essas estatísticas.

## Páginas de apoio

- `/debug/`: menu com acesso às posições do DNA e às respostas dos casos.
- `/debug/gabarito.html`: soluções e códigos dos quatro casos.
- `/debug/positions.html`: seleção de posições no modelo e cópia das coordenadas em JSON.

Essas páginas também fazem parte do build.

## GitHub Pages

O workflow `.github/workflows/deploy-pages.yml` publica o site a cada push na
branch `main`. Ele instala as dependências com `npm ci`, verifica os tipos,
gera o build e publica o conteúdo de `dist/`.

Em **Settings → Pages → Build and deployment → Source**, selecione **GitHub Actions**.
Essa opção já está configurada no repositório `LihnNH/biologia-forense`.
Também é possível publicar manualmente em **Actions → Publicar no GitHub Pages → Run workflow**.

Site: [lihnnh.github.io/biologia-forense](https://lihnnh.github.io/biologia-forense/).
O workflow utiliza o caminho informado pelo Pages como base do Vite, incluindo
os recursos do modelo 3D e as páginas de apoio. Para conferir esse build localmente:

```sh
npm run build -- --base=/biologia-forense/
npm run preview
```

Para usar `biologia-forense.com`, configure também **Settings → Pages → Custom domain**
e os registros DNS no provedor do domínio. Em publicações via Actions, o arquivo
`CNAME` sozinho não configura o domínio; consulte a
[documentação do GitHub](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site).
Depois de configurar o domínio, execute o workflow novamente para atualizar a base do build.

## Licença

O código do projeto usa a [licença MIT](LICENSE), em nome de LihnNH.

O modelo [DNA](https://skfb.ly/onW7w), de LucasPresoto, usa a licença
[Creative Commons Atribuição 4.0 Internacional](https://creativecommons.org/licenses/by/4.0/).
A atribuição original está preservada em [assets/dna.LICENSE](assets/dna.LICENSE).
