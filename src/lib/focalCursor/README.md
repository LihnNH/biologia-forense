# Cursor focal

`FocalCursor` integra o cursor com React. `controller.ts` controla os eventos,
os alvos e as molas da animação. `geometry.ts` calcula os arcos da lupa e os
cantos circulares ou de superelipse sem depender do DOM.

Use uma instância por página e mantenha o objeto de opções estável (definido
fora do componente ou com `useMemo`). A propriedade `active` suspende o efeito
em outras telas ou enquanto um modal estiver aberto.

```tsx
const options = {
  scopeSelector: '#minha-tela',
  targetSelector: '[data-focal-target]',
  continuitySelector: '.grupo-de-alvos',
  targetPadding: 14,
};

<FocalCursor active={telaAtiva && !modalAberto} options={options} />
```

`scopeSelector` limita os alvos elegíveis. `continuitySelector` é opcional:
preserva o contorno nos espaços do grupo que contém o alvo atual. Fora desse
grupo, o cursor volta à lupa. Sem esse seletor, a lupa retorna ao sair do alvo.

`geometry` configura tamanho da lupa, hotspot, quantidade de segmentos,
raio, extensão e formato dos cantos. `fallbackGeometry` configura os cantos
circulares para navegadores sem `corner-shape: squircle`. `nativeCursor`
define o cursor enquanto a camada SVG ainda não está visível; `followRange`
controla quanto o contorno acompanha o ponteiro dentro do alvo.

`followTargetTransform` acompanha a rotação, translação e escala 2D do próprio
alvo, inclusive durante suas animações, sem atrasar essas mudanças com as molas
usadas no deslocamento entre cards. Fica desativado por padrão. Para excluir
um estado da tela, restrinja `targetSelector`; por exemplo,
`.suspect-gallery:not(.is-picking) .suspect-portrait` mantém apenas a lupa no
modo de marcar suspeito.

O módulo respeita movimento reduzido e ponteiros sem hover. Para uso sem
React, `createFocalCursor(svg, options)` oferece `setActive` e `dispose`.
A camada SVG precisa conter quatro paths em `[data-cursor-pieces]` e um path
`[data-cursor-handle]`. `dispose` remove os listeners, cancela a animação e
restaura o cursor nativo. As opções da tela dos suspeitos ficam em
`src/data/suspectCursor.ts`.
