import { Script, Objecao, Nicho } from '@/types'

export const SCRIPTS: Script[] = [
  {
    id: 's1',
    tipo: 'abertura',
    titulo: 'Abertura — Script Principal',
    conteudo: `Olá, meu nome é [SEU NOME], com quem eu falo?

[CLIENTE responde]

Oi [NOME DO CLIENTE], tudo bem?

[CLIENTE responde]

Então [NOME], eu vou te explicar o que eu faço e aí você me diz se é com você que eu converso ou se é com outra pessoa — pode ser? Essa conversa vai ser bem rapidinha pra não tomar muito do seu tempo.

Eu sou executivo(a) da Vallor Assessoria & Marketing. O nosso foco é basicamente ajudar empresas a venderem mais e atrair mais clientes qualificados, gerando um aumento de receita.

O que eu fiz aqui... analisei a empresa de vocês nas redes sociais e Google Meu Negócio, e percebi algumas ações que vocês poderiam estar fazendo para melhorar o fluxo de vendas.

Eu separei essas ações em um documento e gostaria de apresentar — é com você mesmo que eu falo sobre isso?

[SE SIM]: Bacana. Gostaria de apresentar isso em uma reunião online de uns 40 minutos. Podemos fazer ela no dia [X], às [Y] horas? Pode ser?

Perfeito. Vou te chamar no WhatsApp pra confirmar. Te garanto que você vai se surpreender com o que vamos apresentar.`,
  },
  {
    id: 's2',
    tipo: 'decisor',
    titulo: 'Script — Chegando ao Decisor',
    conteudo: `Oi [NOME DO DECISOR], aqui é [SEU NOME] da Vallor Assessoria e Marketing, tudo certo?

[CLIENTE responde]

Vou te explicar o motivo da ligação.

[NOME DO DECISOR], eu encontrei a empresa de vocês no Google, fiz uma pesquisa aprofundada e queria bater um papo de 2 minutinhos pra te apresentar alguns pontos importantes que eu identifiquei. O assunto é bem rápido. Te peguei em um bom momento?

[SE SIM]: Certo, vou ser breve.

Nosso foco é concentrado em AUMENTO DE RECEITA. Através de anúncios e estratégias digitais, levamos um fluxo maior de pessoas para o WhatsApp da empresa — e essas pessoas se convertem em clientes.

Empresas que atendemos tiveram em média um aumento de 20% a 40% no número de clientes.

Me fala uma coisa [NOME]: implementar estratégias para trazer novos clientes todos os dias para a [EMPRESA], faria sentido para vocês hoje?

[SE SIM]: Show! Como eu te pedi só 2 minutos e te peguei de surpresa, não quero extrapolar. Montamos um plano personalizado para a sua empresa — gostaria de apresentar em uma reunião de vídeo de no máximo 40-50 minutos, sem compromisso.

No final você vai sair com várias boas ideias, contrate ou não. Podemos marcar para [OPÇÃO 1] ou [OPÇÃO 2]?`,
  },
  {
    id: 's3',
    tipo: 'secretaria',
    titulo: 'Script — Passando pela Secretária',
    conteudo: `Oi, bom dia! Quem fala?

[SECRETÁRIA responde perguntando sobre o que é]

Aqui é [SEU NOME], sou executivo(a) de vendas da Vallor Assessoria & Marketing. Preciso falar com o [NOME DO DECISOR] por 5 minutinhos.

[SE PEDIR PARA EXPLICAR]:
Eu realizei um diagnóstico da empresa de vocês essa semana, com alguns pontos de melhoria que provavelmente estão fazendo vocês perderem dinheiro. Gostaria de apresentar esse diagnóstico ao [NOME DO DECISOR] — tenho certeza que ele vai querer saber.

⚠️ IMPORTANTE:
— Pareça que conhece o decisor. Chege confiante.
— Se ele não estiver, pergunte o melhor horário para retornar.
— Não deixe a secretária explicar por você — ela não saberá transmitir e ele achará que é mais uma agência comum.`,
  },
  {
    id: 's4',
    tipo: 'fechamento',
    titulo: 'Fechamento — Confirmando a Reunião',
    conteudo: `Horários disponíveis para marcar reunião:

Segunda:  08h às 21h
Terça:    13h30 às 21h
Quarta:   08h às 21h
Quinta:   13h30 às 21h
Sexta:    13h30 às 21h
Sábado:   08h às 14h
Domingo:  Só se for oportunidade excepcional

⚠️ REGRAS:
1. Nunca ofereça reunião fora do horário comercial primeiro — só mencione essa possibilidade SE o decisor disser que está ocupado.
2. Tente marcar para o mesmo dia ou no máximo 2 dias depois.
3. SEMPRE avisar o Hellden no WhatsApp quando marcar uma reunião.
4. Após confirmar: "Vou te chamar no WhatsApp para confirmar [NOME]."`,
  },
]

export const OBJECOES: Objecao[] = [
  {
    id: 'o1',
    gatilho: '🏢 Já tenho agência / já sou atendido',
    resposta: `"[NOME], fico muito feliz que você já esteja sendo atendido — isso mostra que você está comprometido com o negócio.

Mas eu estou te ligando justamente por isso. Fiz algumas análises e identifiquei oportunidades que talvez a empresa atual não está enxergando pela falta de especialidade no seu mercado.

Quero marcar um bate-papo SEM compromisso pra te mostrar essas oportunidades. Se fizer sentido, a gente avança. Se não fizer, tudo bem."`,
  },
  {
    id: 'o2',
    gatilho: '❌ Não tenho interesse no momento',
    resposta: `"[NOME], eu entendo que talvez o que eu te falei agora não seja do seu interesse.

É exatamente por isso que quero marcar um bate-papo — pra te apresentar as análises que fiz da sua empresa onde identifiquei oportunidades concretas.

Você vai sair da reunião com várias boas ideias que pode implementar sozinho, sem necessariamente contratar nossos serviços."`,
  },
  {
    id: 'o3',
    gatilho: '💰 Não tenho investimento agora',
    resposta: `"[NOME], eu entendo 100%.

É exatamente por isso que esse é o momento certo de a gente conversar — pra mudar essa realidade e trazer um aumento de receita.

Se você não fechar uma parceria, dificilmente as coisas vão melhorar de forma orgânica nos próximos meses. Você faz um investimento agora, aperta um pouco as contas, e te garanto que daqui 3 meses o seu negócio vai estar em uma realidade totalmente diferente."`,
  },
  {
    id: 'o4',
    gatilho: '📅 Me liga no próximo mês',
    resposta: `"[NOME], eu até posso te ligar daqui um mês sem problema algum.

Mas preciso entender o que muda entre fechar hoje e fechar daqui a um mês.

Do meu lado, eu enxergo que a gente ganha um mês de trabalho duro — e é muito melhor começar agora e daqui um mês estar colhendo resultados que talvez seu negócio nunca tenha visto, do que começar a trabalhar daqui um mês."`,
  },
  {
    id: 'o5',
    gatilho: '⏰ Estou ocupado agora',
    resposta: `"Sem problema [NOME]! Não vou tomar seu tempo agora.

Quando seria um bom momento para eu te ligar? Prefere de manhã ou de tarde?

[ANOTE O HORÁRIO E LIGUE EXATAMENTE NO HORÁRIO COMBINADO]"`,
  },
  {
    id: 'o6',
    gatilho: '🤔 Que tipo de serviço vocês fazem?',
    resposta: `"[NOME], não vendemos um serviço específico — não vendemos gestão de tráfego isolada, nem pacote de artes, nem cronograma de postagens.

Vendemos AUMENTO DE RECEITA.

Somos um parceiro estratégico. Entregamos um conjunto de soluções digitais que geram um fluxo maior de clientes qualificados para o seu negócio. Por isso o resultado que entregamos vai muito além do marketing digital padrão."`,
  },
]

export const NICHOS: Nicho[] = [
  { id: 'n01', nome: 'Clínicas odontológicas / Dentistas' },
  { id: 'n02', nome: 'Turismo, hotelaria e pousadas' },
  { id: 'n03', nome: 'Clínicas de estética e harmonização' },
  { id: 'n04', nome: 'Clínicas de emagrecimento' },
  { id: 'n05', nome: 'Fisioterapia e massoterapia' },
  { id: 'n06', nome: 'Saúde da mulher / Ginecologia' },
  { id: 'n07', nome: 'Academias e Crossfit' },
  { id: 'n08', nome: 'Salões de beleza' },
  { id: 'n09', nome: 'Confeitarias, padarias e cafeterias' },
  { id: 'n10', nome: 'Óticas e relojoarias' },
  { id: 'n11', nome: 'Imobiliárias e arquitetos' },
  { id: 'n12', nome: 'Escolas e cursos' },
  { id: 'n13', nome: 'Pet shops e creches de cachorro' },
  { id: 'n14', nome: 'Lojas de móveis planejados' },
  { id: 'n15', nome: 'Advocacia' },
  { id: 'n16', nome: 'Construtoras e incorporadoras' },
  { id: 'n17', nome: 'Deliverys e restaurantes' },
  { id: 'n18', nome: 'Estéticas automotivas' },
  { id: 'n19', nome: 'Lojas de roupas e acessórios' },
  { id: 'n20', nome: 'Contabilidades' },
  { id: 'n21', nome: 'Psicólogos e terapeutas' },
  { id: 'n22', nome: 'Artes marciais' },
  { id: 'n23', nome: 'Decoração e ambientes' },
  { id: 'n24', nome: 'Gráficas e papelarias' },
  { id: 'n25', nome: 'Outros' },
]

export const MISSAO = `Impulsionar empresas a prosperarem no mercado, utilizando estratégias de marketing online e offline, gerando valor para seus clientes e para a sociedade.`

export const REGRAS_SDR = [
  'Existem 21 milhões de empresas no Brasil. Não se apegue a um NÃO — quanto mais "Não" receber, mais perto do SIM você está.',
  'Não tenha medo do telefone. A pessoa não te vê, não te conhece, e em 90% dos casos nunca mais vocês vão se falar.',
  'Passe confiança e naturalidade. Seja dinâmico — não seja um robô. As pessoas compram de quem confiam.',
  'Chame sempre a pessoa pelo nome. Anote assim que ela falar e use o nome dela durante toda a ligação.',
  'Se não atender: ligue mais uma vez. Se no próximo dia ligar duas vezes e não atender — coloque como Perdido.',
  'O foco da ligação é ONE THING: fazer o cliente acreditar que precisa de uma reunião com a Vallor.',
  'Seu objetivo na cold call é chegar até o DECISOR e VENDER A REUNIÃO. Não o serviço.',
  'Não estenda a ligação. Deixe claro que é rápido — 2 minutos.',
  'Não vendemos gestão de tráfego. Não vendemos artes. Vendemos AUMENTO DE RECEITA.',
  'Marque reunião para o mesmo dia ou no máximo 2 dias depois. Nunca com intervalo longo.',
  'Sempre avisar o Hellden no WhatsApp quando marcar uma reunião.',
]
