export type CaseId = 'Faca' | 'Veneno' | 'Martelo' | 'Corda';

export interface Suspect {
  name: string;
  role: string;
  age: number;
  meta?: string;
  statement: string;
}

export interface CaseData {
  suspects: Suspect[];
}

export interface CaseResult {
  code: string;
  culprit: string;
  explanation: string;
}

export const CASE_ORDER: CaseId[] = ['Faca', 'Veneno', 'Martelo', 'Corda'];

export const CASE_LABELS: Record<CaseId, string> = {
  Veneno: 'Último Gole',
  Faca: 'Lâmina Sombria',
  Martelo: 'Impacto Fatal',
  Corda: 'Nó Mortal'
};

export const CASES: Record<CaseId, CaseData> = {
  Veneno: {
    suspects: [
      {
        name: 'Ricardo Gomes',
        role: 'Bartender',
        age: 34,
        statement: String.raw`**Idade:** 34 anos

> "Fui eu quem preparou o drink, mas usei os mesmos ingredientes de sempre. Depois comecei a atender outros clientes. Não fiquei observando o copo dele o tempo todo."`
      },
      {
        name: 'Vanessa Ribeiro',
        role: 'Garçonete',
        age: 27,
        statement: String.raw`**Idade:** 27 anos

> "Levei alguns petiscos para o Fernando. Quando voltei para recolher os pratos, ele já tinha ido ao banheiro e o copo estava sobre o balcão."`
      },
      {
        name: 'Marcelo Silva',
        role: 'Cliente',
        age: 40,
        statement: String.raw`**Idade:** 40 anos

> "Conheço o Fernando há alguns anos. Conversamos por uns dez minutos e depois fui jogar sinuca com meus amigos."`
      },
      {
        name: 'Juliana Costa',
        role: 'Gerente do Bar',
        age: 38,
        statement: String.raw`**Idade:** 38 anos

> "Passei boa parte da noite fechando o caixa. Só fui até o balcão quando ouvi os clientes gritando por socorro."`
      },
      {
        name: 'Gustavo Almeida',
        role: 'Ex-sócio da vítima',
        age: 45,
        statement: String.raw`**Idade:** 45 anos

> "Encontrei o Fernando por acaso. Tivemos alguns problemas no passado, mas isso ficou para trás. Conversamos rapidamente e depois fui para outra mesa."`
      }
    ]
  },

  Faca: {
    suspects: [
      {
        name: 'Rafael Oliveira',
        role: 'Chef de cozinha',
        age: 39,
        meta: '11 anos no restaurante',
        statement: String.raw`**Idade:** 39 anos  
**Tempo no restaurante:** 11 anos

> "O Lucas era um bom garoto, mas ultimamente vinha cometendo muitos erros durante o expediente. Eu precisava chamar a atenção dele quase todos os dias.
>
> Hoje tivemos uma discussão porque ele esqueceu de fazer um pedido importante para o estoque.
>
> Depois disso, cada um voltou ao trabalho. Eu permaneci preparando os últimos pratos antes do fechamento.
>
> Quando ouvi os gritos, fui um dos primeiros a correr para ver o que havia acontecido."`
      },
      {
        name: 'Mariana Costa',
        role: 'Sous-chef',
        age: 31,
        statement: String.raw`**Idade:** 31 anos

> "Eu estava organizando os alimentos na câmara fria. Ouvi o chef discutindo com o Lucas, mas isso acontece às vezes em cozinhas movimentadas.
>
> Quando saí da câmara fria, não vi mais o Lucas."`
      },
      {
        name: 'Diego Martins',
        role: 'Garçom',
        age: 26,
        statement: String.raw`**Idade:** 26 anos

> "Entrei na cozinha algumas vezes para buscar os pedidos das últimas mesas.
>
> Vi o Lucas indo em direção ao estoque carregando uma caixa vazia.
>
> Depois não o vi mais."`
      },
      {
        name: 'Patrícia Alves',
        role: 'Caixa',
        age: 29,
        statement: String.raw`**Idade:** 29 anos

> "Eu permaneci no caixa fechando as contas dos clientes.
>
> Não costumo entrar na cozinha, apenas ouvi uma discussão mais cedo, mas não consegui entender o motivo."`
      },
      {
        name: 'Bruno Santos',
        role: 'Auxiliar de Limpeza',
        age: 42,
        statement: String.raw`**Idade:** 42 anos

> "Eu estava lavando o piso da cozinha perto do horário de fechar.
>
> Por isso o chão estava molhado.
>
> Quando encontrei o Lucas caído, saí correndo para chamar ajuda."`
      }
    ]
  },

  Martelo: {
    suspects: [
      {
        name: 'João Batista',
        role: 'Mestre de obras',
        age: 52,
        statement: String.raw`**Idade:** 52 anos

> "O Eduardo reclamava bastante do atraso da reforma e pressionava todo mundo. Na hora do crime eu estava conferindo a entrega de cimento na frente da casa. Só entrei quando ouvi o pessoal gritando."`
      },
      {
        name: 'Carlos Henrique',
        role: 'Pedreiro',
        age: 38,
        statement: String.raw`**Idade:** 38 anos

> "Passei a tarde trabalhando na área externa. Peguei um martelo mais cedo para fixar algumas formas de madeira, mas depois devolvi. Nem entrei no escritório."`
      },
      {
        name: 'Marcelo Lima',
        role: 'Eletricista',
        age: 40,
        statement: String.raw`**Idade:** 40 anos

> "Eu estava terminando a instalação das tomadas do segundo andar. Vi a Laura subir para o quarto quando ela chegou da escola. Depois disso não vi mais ninguém."`
      },
      {
        name: 'Renata Souza',
        role: 'Arquiteta',
        age: 35,
        statement: String.raw`**Idade:** 35 anos

> "Fui conferir algumas medidas da cozinha. O Eduardo parecia preocupado e disse que precisava resolver um assunto de família ainda naquela tarde."`
      },
      {
        name: 'Laura Almeida',
        role: 'Filha da vítima',
        age: 14,
        statement: String.raw`**Idade:** 14 anos

> "Cheguei da escola e subi para o meu quarto. Eu precisava conversar com meu pai, mas desisti. Coloquei fones de ouvido e fiquei lá em cima. Só desci quando ouvi as pessoas correndo."`
      }
    ]
  },

  Corda: {
    suspects: [
      {
        name: 'Helena Martins',
        role: 'Esposa da vítima',
        age: 48,
        statement: String.raw`**Idade:** 48 anos

> "O Rogério estava muito estressado por causa da empresa ultimamente, bebia todas as noites para tentar dormir. Eu estava no andar de cima vendo TV quando percebi que ele demorava a voltar. Quando desci, vi aquela cena horrível."`
      },
      {
        name: 'Marcos Vinícius',
        role: 'Sócio e amigo',
        age: 50,
        statement: String.raw`**Idade:** 50 anos

> "Eu estava na casa a convite deles para jantar. Depois que terminamos de comer, fui até o escritório organizar alguns papéis da sociedade. Fiquei chocado quando ouvimos os gritos da Helena. O Rogério nunca demonstrou que tiraria a própria vida, mas a pressão estava insuportável."`
      },
      {
        name: 'Tereza',
        role: 'Empregada doméstica',
        age: 41,
        statement: String.raw`**Idade:** 41 anos

> "Eu já tinha terminado o meu turno e estava arrumando a cozinha antes de ir para o quarto dos fundos onde durmo. Não ouvi nenhuma briga, apenas o barulho da TV na sala e eles conversando baixo. Só saí quando a patroa começou a gritar por socorro."`
      },
      {
        name: 'Sebastião',
        role: 'Caseiro',
        age: 58,
        statement: String.raw`**Idade:** 58 anos

> "Eu estava na edícula cuidando das ferramentas e conferindo o portão eletrônico. Vi o Marcos chegar por volta das 19h. De vez em quando o patrão me pedia para ajudar a mexer na parte náutica da decoração, mas faz tempo que eu não tocava naquelas cordas."`
      }
    ]
  }
};

export const CASE_RESULTS: Record<CaseId, CaseResult> = {
  Veneno: {
    code: 'CGTA',
    culprit: 'Gustavo Almeida',
    explanation: String.raw`**Gustavo Almeida**, ex-sócio de Fernando, adulterou o drink enquanto a vítima foi ao banheiro e deixou o copo sozinho.

Fernando estava prestes a processá-lo por **desvio de dinheiro**. A garrafa estava limpa e apenas o copo da vítima continha a substância tóxica, mostrando que o veneno foi colocado diretamente na bebida durante o ponto cego das câmeras.`
  },
  Faca: {
    code: 'TAGC',
    culprit: 'Rafael Oliveira',
    explanation: String.raw`O culpado é **Rafael Oliveira**, o chef de cozinha.

Lucas havia descoberto que Rafael desviava ingredientes caros do restaurante para vendê-los por fora e ameaçou denunciá-lo. Aproveitando a falha das câmeras, o chef usou uma faca do próprio restaurante e tentou se esconder entre as digitais de vários funcionários e as pistas comuns da cozinha.`
  },
  Martelo: {
    code: 'GCAT',
    culprit: 'Laura Almeida',
    explanation: String.raw`A responsável é **Laura Almeida**, filha da vítima.

Depois de descobrir a traição do pai e as agressões sofridas pela mãe, Laura foi confrontá-lo no escritório e o atingiu com o martelo durante a discussão. A mensagem no celular, a pulseira quebrada e os respingos de sangue no moletom conectaram Laura diretamente à cena.`
  },
  Corda: {
    code: 'ATCG',
    culprit: 'Marcos Vinícius',
    explanation: String.raw`O culpado é **Marcos Vinícius**, sócio e antigo amigo da vítima.

Rogério havia descoberto um desvio milionário cometido por Marcos. Ele sedou a vítima, usou a escada da lavanderia e amarrou a corda com nós de marinheiro para simular um suicídio. A marca horizontal no pescoço, o sedativo e o conhecimento náutico desmontaram a encenação.`
  }
};

