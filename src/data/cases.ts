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

> "Fui eu quem preparou o drink, usando os mesmos ingredientes de sempre. Depois, fui atender outros clientes. Lembro que Gustavo passou pelo balcão e que Juliana também esteve por perto enquanto eu estava ocupado."`
      },
      {
        name: 'Vanessa Ribeiro',
        role: 'Garçonete',
        age: 27,
        statement: String.raw`**Idade:** 27 anos

> "Levei alguns petiscos para Fernando. Quando voltei para recolher os pratos, ele tinha ido ao banheiro e o copo continuava no balcão, Fernando parecia bem desconfortável com a presença de Gustavo. Juliana estava fechando o caixa, mas, por alguns instantes, não a vi por lá."`
      },
      {
        name: 'Marcelo Silva',
        role: 'Cliente',
        age: 40,
        statement: String.raw`**Idade:** 40 anos

> "Conheço Fernando há alguns anos, e ele sempre vem falando dos conflitos da empresa antiga, principalmente com seu ex sócio, Gustavo. Conversamos por uns dez minutos e depois fui jogar sinuca com meus amigos. Gustavo veio falar comigo e disse que precisava resolver uma questão antiga com Fernando, mas não explicou do que se tratava."`
      },
      {
        name: 'Juliana Costa',
        role: 'Gerente do Bar',
        age: 38,
        statement: String.raw`**Idade:** 38 anos

> "Passei boa parte da noite fechando o caixa. Em determinado momento, precisei me afastar para buscar alguns comprovantes. Quando voltei, vi Gustavo perto do balcão, mas achei que estivesse esperando alguém."`
      },
      {
        name: 'Gustavo Almeida',
        role: 'Ex-sócio da vítima',
        age: 45,
        statement: String.raw`**Idade:** 45 anos

> "Encontrei Fernando por acaso. Tivemos alguns problemas de trabalho no passado, mas isso ficou para trás. Conversamos rapidamente e depois fui para outra mesa. Não me lembro de ter passado pelo balcão novamente naquela noite."`
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

> "Lucas vinha cometendo erros no trabalho, e hoje discutimos por causa de um pedido do estoque. Depois, continuei preparando os pratos e organizando algumas coisas na cozinha. Quando terminei minhas tarefas, estava indo embora até ouvir Bruno gritando, fui um dos primeiros a chegar ao local e fiquei surpreso ao encontrar Lucas daquela maneira."`
      },
      {
        name: 'Mariana Costa',
        role: 'Sous-chef',
        age: 31,
        statement: String.raw`**Idade:** 31 anos

> "Eu estava organizando os alimentos na câmara fria, pois precisamos de espaço. Temos uma grande quantidade de legumes, principalmente tomates, já que cozinhamos muitos molhos vermelhos. Ouvi Lucas discutindo com Rafael e não consegui entender, só entendi que Chef ia demiti-lo. Mas, quando saí da câmara fria, vi apenas Rafael lavando as mãos. Além disso, a faca que eu tinha deixado na bancada havia sumido."`
      },
      {
        name: 'Diego Martins',
        role: 'Garçom',
        age: 26,
        statement: String.raw`**Idade:** 26 anos

> "Entrei na cozinha algumas vezes para buscar pedidos. Vi Lucas indo em direção ao estoque, chateado. Mais tarde, peguei a faca de Mariana emprestada para entregar a um cliente que havia derrubado a sua. No corredor, encontrei Rafael e entreguei a faca para ele, já que depois ele voltaria à cozinha."`
      },
      {
        name: 'Patrícia Alves',
        role: 'Caixa',
        age: 29,
        statement: String.raw`**Idade:** 29 anos

> "Eu estava no caixa fechando as contas dos clientes. Lembro que as câmeras já tinham apresentado falhas em outra ocasião, quando roubaram nosso restaurante. Só vi Diego ajudando um cliente para melhorar a reputação do nosso restaurante e, depois, entregando algo para Rafael. Quando olhei para o lado, Rafael passou por mim em direção ao estoque para pegar os tomates que haviam acabado, segundo ele."`
      },
      {
        name: 'Bruno Santos',
        role: 'Auxiliar de Limpeza',
        age: 42,
        statement: String.raw`**Idade:** 42 anos

> "Eu estava lavando o piso da cozinha perto do horário de fechar. Ouvi Rafael desabafar com Mariana que resolveria algum problema com Lucas naquela noite. Depois, encontrei o corpo de Lucas com a faca cravada nele, quando fui limpar os fundos do restaurante."`
      }
    ]
  },

  Martelo: {
    suspects: [
      {
        name: 'João Batista',
        role: 'Engenheiro',
        age: 52,
        statement: String.raw`**Idade:** 52 anos

> "O Eduardo reclamava bastante do atraso da reforma e pressionava todo mundo. Na hora do crime eu estava conferindo a entrega de cimento na frente da casa. Só entrei quando ouvi o pessoal gritando. Laura foi a última a descer as escadas com a correria"`
      },
      {
        name: 'Carlos Henrique',
        role: 'Pedreiro',
        age: 38,
        statement: String.raw`**Idade:** 38 anos

> "Passei a tarde trabalhando na área externa. Usei um martelo para ajustar algumas formas de madeira e depois deixei a ferramenta perto da entrada. Vi algumas pessoas circulando pela casa, mas estava ocupado demais para prestar atenção. Só percebi que algo tinha acontecido quando começaram a gritar."`
      },
      {
        name: 'Marcelo Lima',
        role: 'Eletricista',
        age: 40,
        statement: String.raw`**Idade:** 40 anos

> "Estava instalando as tomadas do segundo andar quando vi Laura chegar da escola. Ela subiu para o quarto, mas algum tempo depois ouvi passos descendo a escada. Não consegui ver quem era. Também escutei uma discussão no andar de baixo, mas achei que fosse um assunto particular da família.”`
      },
      {
        name: 'Renata Souza',
        role: 'Arquiteta',
        age: 35,
        statement: String.raw`**Idade:** 35 anos

> "Fui conferir algumas medidas da cozinha. Eduardo parecia preocupado e comentou que precisava resolver um problema familiar. Mais tarde, ouvi vozes alteradas vindo da direção do escritório. Não consegui entender a conversa, mas uma das vozes parecia ser de uma mulher. Preferi não me envolver."`
      },
      {
        name: 'Laura Almeida',
        role: 'Filha da vítima',
        age: 18,
        statement: String.raw`**Idade:** 18 anos

> "Cheguei do colégio e fui direto para o quarto. Estava chateada com algumas coisas que descobri recentemente e não queria conversar com ninguém. Coloquei meus fones de ouvido e tentei me distrair. Só desci quando ouvi a movimentação das pessoas. Não sei o que aconteceu no escritório."`
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

> "Rogério andava muito estressado por causa da empresa. Ultimamente, bebia quase todas as noites para conseguir dormir. Naquela noite, percebi que ele estava especialmente preocupado depois de conversar com Marcos. Subi para assistir televisão e, quando desci para procurá-lo, encontrei aquela cena horrível. Não consigo acreditar no que aconteceu."`
      },
      {
        name: 'Marcos Vinícius',
        role: 'Sócio e amigo',
        age: 50,
        statement: String.raw`**Idade:** 50 anos

> "Fui convidado para jantar e aproveitei para conversar com Rogério sobre alguns documentos da sociedade. Ele estava muito nervoso, chegou a beber enquanto discutíamos os problemas da empresa. Depois fui ao escritório organizar alguns papéis. Só soube do ocorrido quando ouvi Helena gritando. Rogério estava passando por muita pressão, mas nunca imaginei que chegaria a esse ponto."`
      },
      {
        name: 'Tereza',
        role: 'Empregada doméstica',
        age: 41,
        statement: String.raw`**Idade:** 41 anos

> "Terminei de arrumar a cozinha depois do jantar. Lembro que Marcos perguntou onde ficavam algumas coisas da lavanderia, mas não achei estranho, porque ele frequentava a casa havia anos. Mais tarde, ouvi um barulho de algo sendo arrastado, mas pensei que fosse Sebastião trabalhando. Quando a patroa gritou, saí correndo para ajudar."`
      },
      {
        name: 'Sebastião',
        role: 'Caseiro',
        age: 58,
        statement: String.raw`**Idade:** 58 anos

> "Passei boa parte da noite na área dos fundos da casa, cuidando das ferramentas e do portão eletrônico. Vi Marcos chegar por volta das sete. Eu costumava ajudar Rogério com as cordas da decoração náutica, mas ele e Marcos também entendiam bastante do assunto. Naquela noite, percebi que a escada da lavanderia não estava no lugar de costume. Pensei que alguém tivesse usado para algum reparo."`
      }
    ]
  }
};

export const CASE_RESULTS: Record<CaseId, CaseResult> = {
  Veneno: {
    code: 'CGTA',
    culprit: 'Gustavo Almeida',
    explanation: String.raw`**Gustavo Almeida**, ex-sócio de Fernando, adulterou o drink enquanto a vítima foi ao banheiro e deixou o copo sozinho.

Fernando estava prestes a processá-lo por desvio de dinheiro. A garrafa estava limpa e apenas o copo da vítima continha a substância tóxica, mostrando que o veneno foi colocado diretamente na bebida durante o ponto cego das câmeras.`
  },
  Faca: {
    code: 'TAGC',
    culprit: 'Rafael Oliveira',
    explanation: String.raw`O culpado é **Rafael Oliveira**, o chef de cozinha.

Lucas havia descoberto que Rafael desviava dinheiro do restaurante para se usufruir e ameaçou denunciá-lo. Aproveitando a falha das câmeras, o chef pegou escondido a faca do próprio restaurante, e chamou Lucas para conversar no estoque, Lucas imaginava ser demitido, mas o destino verdadeiro foi a sua morte`
  },
  Martelo: {
    code: 'GCAT',
    culprit: 'Laura Almeida',
    explanation: String.raw`A responsável é **Laura Almeida**, filha da vítima.

Depois de descobrir a traição do pai e as agressões sofridas pela mãe, Laura foi confrontá-lo no escritório e o atingiu com o martelo durante a discussão. A mensagem no celular, a pulseira quebrada e o sangue na camiseta de Laura a ligam diretamente à cena do crime.`
  },
  Corda: {
    code: 'ATCG',
    culprit: 'Marcos Vinícius',
    explanation: String.raw`O culpado é **Marcos Vinícius**, sócio e antigo amigo da vítima.

Rogério havia descoberto um desvio milionário cometido por Marcos. Ele sedou a vítima, usou a escada da lavanderia e amarrou a corda com nós de marinheiro para simular um suicídio. A marca horizontal no pescoço, o sedativo no corpo e seu conhecimento náutico exposeram a encenação.`
  }
};

