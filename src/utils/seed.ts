// src/utils/seed.ts — Demo seed data

import {
  User, Call, Lead, KanbanCol, CadenciaTemplate,
  ChecklistCall, MeetingLocal, CallStatus
} from '../types'
import { genId, setUsers, setCalls, setLeads, setCols, setTemplates, isSeeded } from './storage'
import { getWeekKey, dayOfWeekIndex, getMesLabel } from './weekUtils'
import { format, subDays, addDays } from 'date-fns'

function dateStr(daysAgo: number): string {
  return format(subDays(new Date(), daysAgo), 'yyyy-MM-dd')
}

function tsFor(daysAgo: number, hour: number, min = 0): number {
  const d = subDays(new Date(), daysAgo)
  d.setHours(hour, min, 0, 0)
  return d.getTime()
}

const USERS: User[] = [
  {
    id: 'u_admin',
    nome: 'Administrador',
    email: 'admin@valloragencia.com',
    senha: 'admin123',
    role: 'admin',
    avatar: '#f0c040',
    metaDiariaLigacoes: 50,
    metaDiariaReunioes: 5,
    ativo: true,
    criadoEm: Date.now(),
  },
  {
    id: 'u_joao',
    nome: 'João Silva',
    email: 'joao@valloragencia.com',
    senha: 'vallor123',
    role: 'vendedor',
    avatar: '#4080f0',
    metaDiariaLigacoes: 50,
    metaDiariaReunioes: 5,
    ativo: true,
    criadoEm: Date.now(),
  },
  {
    id: 'u_ana',
    nome: 'Ana Costa',
    email: 'ana@valloragencia.com',
    senha: 'vallor123',
    role: 'vendedor',
    avatar: '#8050d0',
    metaDiariaLigacoes: 50,
    metaDiariaReunioes: 5,
    ativo: true,
    criadoEm: Date.now(),
  },
  {
    id: 'u_marcos',
    nome: 'Marcos Oliveira',
    email: 'marcos@valloragencia.com',
    senha: 'vallor123',
    role: 'vendedor',
    avatar: '#e05a30',
    metaDiariaLigacoes: 50,
    metaDiariaReunioes: 5,
    ativo: true,
    criadoEm: Date.now(),
  },
]

const COLS: KanbanCol[] = [
  { id: 'col_1', nome: 'Prospecção',       cor: '#e05a30', ordem: 1, script: 'Olá {{nome}}, sou da Agência Vallor. Trabalhamos com marketing digital para {{segmento}}. Posso te falar por 3 minutos?', isWon: false, isLost: false },
  { id: 'col_2', nome: 'Contato Feito',    cor: '#f0c040', ordem: 2, script: 'Oi {{nome}}, tivemos uma conversa inicial. Queria agendar 15 minutos para mostrar como outros {{segmento}} cresceram conosco.',  isWon: false, isLost: false },
  { id: 'col_3', nome: 'Proposta Enviada', cor: '#4080f0', ordem: 3, script: 'Oi {{nome}}, após nossa conversa preparei uma proposta personalizada. Quando podemos revisar juntos?',                              isWon: false, isLost: false },
  { id: 'col_4', nome: 'Negociação',       cor: '#8050d0', ordem: 4, script: 'Oi {{nome}}, quero garantir que a proposta atende suas necessidades. Alguma dúvida ou ajuste que precisamos fazer?',               isWon: false, isLost: false },
  { id: 'col_5', nome: 'Ganho ✅',         cor: '#30d090', ordem: 5, script: 'Obrigado, {{nome}}! Bem-vindo à família Vallor. Vou te adicionar no grupo e agendar nossa reunião de onboarding!',                 isWon: true,  isLost: false },
  { id: 'col_6', nome: 'Perdido ❌',       cor: '#4a4560', ordem: 6, script: '',                                                                                                                                   isWon: false, isLost: true  },
]

const TEMPLATES: CadenciaTemplate[] = [
  {
    id: 'tpl_1',
    nome: 'Prospecção Padrão',
    etapas: [
      { dia: 1,  tipo: 'ligacao',   instrucao: 'Ligação de apresentação — foco em dor e diagnóstico' },
      { dia: 3,  tipo: 'whatsapp',  instrucao: 'WhatsApp de follow-up — enviar cases do segmento' },
      { dia: 7,  tipo: 'ligacao',   instrucao: 'Segunda ligação — proposta de valor e objeções' },
      { dia: 14, tipo: 'whatsapp',  instrucao: 'WhatsApp final — urgência e chamada para ação' },
      { dia: 30, tipo: 'ligacao',   instrucao: 'Reativação — novo momento, novo contexto' },
    ],
  },
  {
    id: 'tpl_2',
    nome: 'Lead Quente',
    etapas: [
      { dia: 1, tipo: 'ligacao',  instrucao: 'Ligação imediata — lead demonstrou interesse forte' },
      { dia: 2, tipo: 'whatsapp', instrucao: 'WhatsApp com proposta personalizada formatada' },
      { dia: 4, tipo: 'ligacao',  instrucao: 'Ligação de fechamento — negociação final' },
      { dia: 7, tipo: 'ligacao',  instrucao: 'Última tentativa — check final de interesse' },
    ],
  },
]

function makeCall(
  id: string,
  nome: string,
  empresa: string,
  numero: string,
  daysAgo: number,
  hour: number,
  status: CallStatus,
  operadorId: string,
  operadorNome: string,
  reuniao: boolean,
  anotacao: string,
  followup: boolean,
  followupDaysFromNow: number | null,
  leadId: string | null,
  checklist: Partial<ChecklistCall> = {},
): Call {
  const ts = tsFor(daysAgo, hour)
  const date = dateStr(daysAgo)
  const d = new Date(ts)
  return {
    id,
    nome,
    numero,
    empresa,
    nicho: '',
    status,
    reuniaoAgendada: reuniao,
    reuniaoData: reuniao ? format(addDays(new Date(), 1), 'yyyy-MM-dd') : null,
    reuniaoHora: reuniao ? '14:00' : null,
    reuniaoLocal: 'meet',
    anotacao,
    checklist: {
      apresentouProposta:   checklist.apresentouProposta   ?? false,
      levantouObjecao:      checklist.levantouObjecao      ?? false,
      agendouProximoPasso:  checklist.agendouProximoPasso  ?? false,
      demonstrouInteresse:  checklist.demonstrouInteresse  ?? false,
      solicitouRetorno:     checklist.solicitouRetorno      ?? false,
    },
    followup,
    followupData: followup && followupDaysFromNow !== null
      ? format(addDays(new Date(), followupDaysFromNow), 'yyyy-MM-dd')
      : null,
    followupNota: followup ? 'Retornar para confirmar decisão.' : '',
    followupFeito: false,
    operadorId,
    operadorNome,
    leadId,
    timestamp: ts,
    diaSemana: d.getDay() as 0|1|2|3|4|5|6,
    semanaKey: getWeekKey(d),
    mes: format(d, 'yyyy-MM'),
    tentativas: 1,
    periodo: '',
  }
}

function buildCalls(): Call[] {
  const calls: Call[] = []

  // ─── João — hoje (0 days ago) — 35 calls ──────────────────────────────
  const jDesc = [
    ['Carlos Souza',     'Clínica Dental Prime', '85988001122'],
    ['Marcia Lima',      'Ótica Central',         '85999334455'],
    ['Paulo Ferreira',   'Imob Flex',             '85977221133'],
    ['Renata Alves',     'Dental Care',           '85911442266'],
    ['Fernando Costa',   'Seguros Total',         '85922553377'],
    ['Juliana Reis',     'Turismo & Cia',         '85933664488'],
    ['Roberto Mendes',   'OticoVision',           '85944775599'],
    ['Sandra Santos',    'ImobolFácil',           '85955886600'],
    ['Eduardo Neves',    'Saúde Prime',           '85966997711'],
    ['Cristina Lopes',   'Dental Art',            '85977008822'],
  ]
  jDesc.forEach(([nome, empresa, numero], i) => {
    calls.push(makeCall(`c_j0_${i}`, nome, empresa, numero, 0, 8+i, 'atendida', 'u_joao', 'João Silva', i===0, i===0 ? 'Lead muito interessado no pacote completo. Falou que tem dores com a gestão de tráfego. Agendei reunião para amanhã às 14h no Meet.' : `Conversa produtiva. Lead mencionou que está avaliando concorrentes. Enviei material por email. ${i%2===0 ? 'Demonstrou interesse claro.' : 'Pediu retorno em 2 semanas.'}`, i<3, i<3 ? 2+i : null, i===0 ? 'l_01' : null, i===0 ? {apresentouProposta:true, levantouObjecao:true, agendouProximoPasso:true, demonstrouInteresse:true, solicitouRetorno:true} : {apresentouProposta:true, demonstrouInteresse:true}))
  })
  // more today calls for João
  for (let i = 10; i < 35; i++) {
    const status = i % 4 === 0 ? 'perdida' : i % 4 === 1 ? 'nao-atendeu' : i % 4 === 2 ? 'caixa-postal' : 'atendida'
    calls.push(makeCall(`c_j0_x${i}`, `Contato ${i}`, `Empresa ${i}`, `859${String(i).padStart(8,'0')}`, 0, Math.floor(8 + i * 0.4), status, 'u_joao', 'João Silva', false, status === 'atendida' ? `Ligação rápida. Lead pediu mais informações sobre o serviço. Enviamos apresentação.` : '', false, null, null))
  }

  // ─── João — yesterday (1 day ago) — 50 calls ──────────────────────────
  for (let i = 0; i < 50; i++) {
    const status: CallStatus = i < 20 ? 'atendida' : i < 35 ? 'nao-atendeu' : i < 44 ? 'caixa-postal' : 'perdida'
    const reuniao = i < 5
    calls.push(makeCall(`c_j1_${i}`, `Lead dia anterior ${i}`, `Empresa D-1 ${i}`, `859${String(i+100).padStart(8,'0')}`, 1, Math.floor(8 + i * 0.2), status, 'u_joao', 'João Silva', reuniao, status === 'atendida' ? `Lead apresentou interesse no serviço de tráfego pago. Mencionou que o Instagram está com baixo engajamento. ${reuniao ? 'Agendamos reunião de diagnóstico.' : 'Enviei proposta por email.'}` : '', i >= 5 && i < 15, i >= 5 && i < 15 ? 3+i%5 : null, null, i < 5 ? {apresentouProposta:true, levantouObjecao:true, agendouProximoPasso:true, demonstrouInteresse:true, solicitouRetorno:true} : {}))
  }

  // ─── João — 2 days ago — 45 calls ─────────────────────────────────────
  for (let i = 0; i < 45; i++) {
    const status: CallStatus = i < 18 ? 'atendida' : i < 30 ? 'nao-atendeu' : 'caixa-postal'
    const reuniao = i < 4
    calls.push(makeCall(`c_j2_${i}`, `Lead -2d ${i}`, `Empresa D-2 ${i}`, `859${String(i+200).padStart(8,'0')}`, 2, Math.floor(8 + i*0.22), status, 'u_joao', 'João Silva', reuniao, status === 'atendida' ? `Conversa de 8 minutos. Identificamos que o cliente tem budget para investimento em mídia. ${reuniao ? 'Proposta enviada e reunião confirmada.' : 'Próximo passo: enviar cases.'}` : '', i>=4 && i<10, i>=4 && i<10 ? 1 : null, null))
  }

  // ─── Ana — today — 28 calls ───────────────────────────────────────────
  const aDesc = [
    ['Dr. André Martins',  'Odonto Smile',      '85999001234'],
    ['Fernanda Xavier',    'Ótica Visão',       '85988112345'],
    ['Lucas Torres',       'Imob Prime',        '85977223456'],
    ['Beatriz Carvalho',   'Health+',           '85966334567'],
    ['Thiago Barros',      'Viagens Top',       '85955445678'],
  ]
  aDesc.forEach(([nome, empresa, numero], i) => {
    const reuniao = i <= 1
    calls.push(makeCall(`c_a0_${i}`, nome, empresa, numero, 0, 9+i, 'atendida', 'u_ana', 'Ana Costa', reuniao, `Atendimento excelente. Cliente demonstrou interesse claro no serviço de anúncios. ${reuniao ? 'Reunião agendada para confirmar proposta.' : 'Enviei material de cases.'}`, !reuniao && i >= 2, !reuniao && i >= 2 ? 2 : null, i<2 ? `l_0${i+3}` : null, reuniao ? {apresentouProposta:true, levantouObjecao:true, agendouProximoPasso:true, demonstrouInteresse:true, solicitouRetorno:false} : {apresentouProposta:true, demonstrouInteresse:true}))
  })
  for (let i = 5; i < 28; i++) {
    const status: CallStatus = i % 3 === 0 ? 'nao-atendeu' : i % 3 === 1 ? 'atendida' : 'caixa-postal'
    calls.push(makeCall(`c_a0_x${i}`, `Prospect ${i}`, `Empresa A-0 ${i}`, `859${String(i+300).padStart(8,'0')}`, 0, Math.floor(9 + i*0.45), status, 'u_ana', 'Ana Costa', false, status === 'atendida' ? 'Cliente aberto a conversar sobre marketing digital. Pediu mais informações sobre resultados anteriores.' : '', false, null, null))
  }

  // ─── Ana — yesterday — 50 calls ───────────────────────────────────────
  for (let i = 0; i < 50; i++) {
    const status: CallStatus = i < 22 ? 'atendida' : i < 38 ? 'nao-atendeu' : 'perdida'
    const reuniao = i < 3
    calls.push(makeCall(`c_a1_${i}`, `Ana Lead -1 ${i}`, `Empresa A-1 ${i}`, `859${String(i+400).padStart(8,'0')}`, 1, Math.floor(9 + i*0.2), status, 'u_ana', 'Ana Costa', reuniao, status === 'atendida' ? `Lead do segmento de odontologia. Tem clínica própria há 5 anos. Quer expandir digital. ${reuniao ? 'Reunião de diagnóstico agendada.' : 'Follow-up agendado.'}` : '', i>=3 && i<12, i>=3 && i<12 ? 2+i%4 : null, null))
  }

  // ─── Marcos — today — 18 calls ────────────────────────────────────────
  for (let i = 0; i < 18; i++) {
    const status: CallStatus = i < 8 ? 'atendida' : i < 13 ? 'nao-atendeu' : 'caixa-postal'
    const reuniao = i === 0
    calls.push(makeCall(`c_m0_${i}`, `Marcos Prospect ${i}`, `Empresa M-0 ${i}`, `859${String(i+500).padStart(8,'0')}`, 0, Math.floor(9 + i*0.5), status, 'u_marcos', 'Marcos Oliveira', reuniao, status === 'atendida' ? 'Ligação de 5 min. Apresentei a proposta de valor. Cliente ficou interessado no produto de gestão de tráfego.' : '', i===1, i===1 ? 1 : null, null))
  }

  // ─── Marcos — yesterday — 32 calls ────────────────────────────────────
  for (let i = 0; i < 32; i++) {
    const status: CallStatus = i < 12 ? 'atendida' : i < 24 ? 'nao-atendeu' : 'caixa-postal'
    const reuniao = i < 2
    calls.push(makeCall(`c_m1_${i}`, `Marcos Lead -1 ${i}`, `Empresa M-1 ${i}`, `859${String(i+600).padStart(8,'0')}`, 1, Math.floor(9 + i*0.25), status, 'u_marcos', 'Marcos Oliveira', reuniao, status === 'atendida' ? 'Lead aberto para conversar. Tem interesse em gestão de anúncios no Meta. Enviei briefing.' : '', false, null, null))
  }

  return calls
}

function buildLeads() {
  const tomorrow = format(addDays(new Date(), 1), 'yyyy-MM-dd')
  const in3days  = format(addDays(new Date(), 3), 'yyyy-MM-dd')
  const in7days  = format(addDays(new Date(), 7), 'yyyy-MM-dd')
  const today    = format(new Date(), 'yyyy-MM-dd')

  return [
    {
      id: 'l_01', colId: 'col_2', nome: 'Carlos Souza', empresa: 'Clínica Dental Prime', telefone: '(85) 98800-1122', email: 'carlos@dentalprime.com.br', valor: 2800, venc: in3days, responsavelId: 'u_joao', tag: 'dentista' as const, prioridade: 'alta' as const, origem: 'ligacao' as const, obs: 'Grande clínica no centro. Tem 3 consultórios. Budget confirmado.',
      atividades: [
        { id: genId(), txt: 'Lead criado via ligação', tipo: 'criacao' as const, autorId: 'u_joao', autorNome: 'João Silva', ts: tsFor(0, 8) },
        { id: genId(), txt: 'Demonstrou interesse no plano completo de anúncios', tipo: 'nota' as const, autorId: 'u_joao', autorNome: 'João Silva', ts: tsFor(0, 9) },
        { id: genId(), txt: 'Reunião agendada para amanhã às 14h', tipo: 'reuniao' as const, autorId: 'u_joao', autorNome: 'João Silva', ts: tsFor(0, 10) },
      ],
      reunioes: [{ id: genId(), data: tomorrow, hora: '14:00', local: 'meet' as const, status: 'agendada' as const, obs: 'Apresentar cases de clínicas odontológicas', criadoEm: Date.now() }],
      script: COLS[1].script, criadoEm: tsFor(0, 8), atualizadoEm: tsFor(0, 10),
    },
    {
      id: 'l_02', colId: 'col_3', nome: 'Dra. Patrícia Mello', empresa: 'Odonto Excellence', telefone: '(85) 99911-2233', email: 'contato@odontoexcellence.com', valor: 4500, venc: in7days, responsavelId: 'u_ana', tag: 'dentista' as const, prioridade: 'alta' as const, origem: 'indicacao' as const, obs: 'Indicação do Carlos Souza. Já conhece o serviço.',
      atividades: [
        { id: genId(), txt: 'Lead criado via indicação de Carlos Souza', tipo: 'criacao' as const, autorId: 'u_ana', autorNome: 'Ana Costa', ts: tsFor(3, 10) },
        { id: genId(), txt: 'Proposta de R$ 4.500/mês enviada por email', tipo: 'nota' as const, autorId: 'u_ana', autorNome: 'Ana Costa', ts: tsFor(2, 14) },
      ],
      reunioes: [{ id: genId(), data: in3days, hora: '10:00', local: 'zoom' as const, status: 'agendada' as const, obs: 'Revisão de proposta e negociação de contrato', criadoEm: Date.now() }],
      script: COLS[2].script, criadoEm: tsFor(3, 10), atualizadoEm: tsFor(2, 14),
    },
    {
      id: 'l_03', colId: 'col_4', nome: 'André Martins', empresa: 'Imob Prime Corretora', telefone: '(85) 99922-3344', email: 'andre@imobprime.com', valor: 3200, venc: tomorrow, responsavelId: 'u_ana', tag: 'imoveis' as const, prioridade: 'alta' as const, origem: 'ads' as const, obs: 'Lead veio via anúncio no Instagram. Muito quente.',
      atividades: [
        { id: genId(), txt: 'Lead captado via anúncio Meta Ads', tipo: 'criacao' as const, autorId: 'u_ana', autorNome: 'Ana Costa', ts: tsFor(5, 9) },
        { id: genId(), txt: 'Ligação de 15 min — muito animado com resultados', tipo: 'ligacao' as const, autorId: 'u_ana', autorNome: 'Ana Costa', ts: tsFor(4, 11) },
        { id: genId(), txt: 'Proposta personalizada enviada R$ 3.200/mês', tipo: 'nota' as const, autorId: 'u_ana', autorNome: 'Ana Costa', ts: tsFor(3, 16) },
        { id: genId(), txt: 'Em negociação final de escopo', tipo: 'movimento' as const, autorId: 'u_ana', autorNome: 'Ana Costa', ts: tsFor(1, 9) },
      ],
      reunioes: [{ id: genId(), data: today, hora: '15:00', local: 'presencial' as const, status: 'agendada' as const, obs: 'Reunião final de fechamento — trazer contrato', criadoEm: Date.now() }],
      script: COLS[3].script, criadoEm: tsFor(5, 9), atualizadoEm: tsFor(1, 9),
    },
    {
      id: 'l_04', colId: 'col_1', nome: 'Fernanda Xavier', empresa: 'Ótica Visão Clara', telefone: '(85) 98800-5566', email: 'fernanda@oticavisaoclara.com', valor: 1900, venc: in7days, responsavelId: 'u_marcos', tag: 'otica' as const, prioridade: 'media' as const, origem: 'ligacao' as const, obs: 'Pequena ótica familiar. Nunca investiu em digital.',
      atividades: [
        { id: genId(), txt: 'Lead criado via prospecção ativa', tipo: 'criacao' as const, autorId: 'u_marcos', autorNome: 'Marcos Oliveira', ts: tsFor(2, 11) },
        { id: genId(), txt: 'Demonstrou interesse inicial em tráfego local', tipo: 'nota' as const, autorId: 'u_marcos', autorNome: 'Marcos Oliveira', ts: tsFor(2, 11) },
      ],
      reunioes: [],
      script: COLS[0].script, criadoEm: tsFor(2, 11), atualizadoEm: tsFor(2, 11),
    },
    {
      id: 'l_05', colId: 'col_2', nome: 'Ricardo Basto', empresa: 'Turismo & Experiências', telefone: '(85) 99933-7788', email: 'ricardo@turismoeexp.com', valor: 2400, venc: in7days, responsavelId: 'u_joao', tag: 'turismo' as const, prioridade: 'media' as const, origem: 'organico' as const, obs: 'Agência de turismo fora de época. Budget restrito mas interesse real.',
      atividades: [
        { id: genId(), txt: 'Lead captado via formulário orgânico', tipo: 'criacao' as const, autorId: 'u_joao', autorNome: 'João Silva', ts: tsFor(6, 14) },
        { id: genId(), txt: 'Contato realizado — interesse confirmado', tipo: 'ligacao' as const, autorId: 'u_joao', autorNome: 'João Silva', ts: tsFor(4, 10) },
      ],
      reunioes: [{ id: genId(), data: in7days, hora: '11:00', local: 'meet' as const, status: 'agendada' as const, obs: 'Apresentação de proposta inicial', criadoEm: Date.now() }],
      script: COLS[1].script, criadoEm: tsFor(6, 14), atualizadoEm: tsFor(4, 10),
    },
    {
      id: 'l_06', colId: 'col_3', nome: 'Camila Rodrigues', empresa: 'Seguros Sul América', telefone: '(85) 99944-8899', email: 'camila@segurossulamerica.com', valor: 3600, venc: in3days, responsavelId: 'u_marcos', tag: 'seguros' as const, prioridade: 'alta' as const, origem: 'indicacao' as const, obs: 'Corretora com carteira grande de clientes. Muito potencial.',
      atividades: [
        { id: genId(), txt: 'Lead indicado pelo parceiro regional', tipo: 'criacao' as const, autorId: 'u_marcos', autorNome: 'Marcos Oliveira', ts: tsFor(7, 9) },
        { id: genId(), txt: 'Reunião de diagnóstico realizada — 45 min', tipo: 'reuniao' as const, autorId: 'u_marcos', autorNome: 'Marcos Oliveira', ts: tsFor(5, 14) },
        { id: genId(), txt: 'Proposta de R$ 3.600/mês (pacote avançado) enviada', tipo: 'nota' as const, autorId: 'u_marcos', autorNome: 'Marcos Oliveira', ts: tsFor(3, 17) },
      ],
      reunioes: [],
      script: COLS[2].script, criadoEm: tsFor(7, 9), atualizadoEm: tsFor(3, 17),
    },
    {
      id: 'l_07', colId: 'col_1', nome: 'Dr. Guilherme Prates', empresa: 'Saúde & Bem Estar Clínica', telefone: '(85) 99955-0011', email: 'guilherme@saudebebestar.com', valor: 2200, venc: null, responsavelId: 'u_joao', tag: 'saude' as const, prioridade: 'baixa' as const, origem: 'ads' as const, obs: 'Clínica de saúde integrativa. Ainda pesquisando soluções.',
      atividades: [
        { id: genId(), txt: 'Lead captado via Google Ads', tipo: 'criacao' as const, autorId: 'u_joao', autorNome: 'João Silva', ts: tsFor(10, 9) },
      ],
      reunioes: [],
      script: COLS[0].script, criadoEm: tsFor(10, 9), atualizadoEm: tsFor(10, 9),
    },
    {
      id: 'l_08', colId: 'col_5', nome: 'Maria Eduarda Lins', empresa: 'Clínica Sorriso Perfeito', telefone: '(85) 98811-2233', email: 'madu@sorrisoperfeito.com', valor: 3100, venc: null, responsavelId: 'u_ana', tag: 'dentista' as const, prioridade: 'media' as const, origem: 'ligacao' as const, obs: 'Cliente FECHADO! Contrato assinado em 08/03.',
      atividades: [
        { id: genId(), txt: 'Lead criado', tipo: 'criacao' as const, autorId: 'u_ana', autorNome: 'Ana Costa', ts: tsFor(20, 9) },
        { id: genId(), txt: 'Lead movido para Ganho — contrato assinado 🎉', tipo: 'movimento' as const, autorId: 'u_ana', autorNome: 'Ana Costa', ts: tsFor(6, 15) },
      ],
      reunioes: [],
      script: COLS[4].script, criadoEm: tsFor(20, 9), atualizadoEm: tsFor(6, 15),
    },
    {
      id: 'l_09', colId: 'col_6', nome: 'João Paulo Martins', empresa: 'Pet Shop Amigo Fiel', telefone: '(85) 99966-1122', email: 'joaopaulo@amigofiel.com', valor: 0, venc: null, responsavelId: 'u_marcos', tag: 'outros' as const, prioridade: 'baixa' as const, origem: 'ligacao' as const, obs: 'Perdido — cliente optou por agência de custo menor.',
      atividades: [
        { id: genId(), txt: 'Lead criado', tipo: 'criacao' as const, autorId: 'u_marcos', autorNome: 'Marcos Oliveira', ts: tsFor(14, 9) },
        { id: genId(), txt: 'Lead perdido — escolheu concorrente por preço', tipo: 'movimento' as const, autorId: 'u_marcos', autorNome: 'Marcos Oliveira', ts: tsFor(8, 11) },
      ],
      reunioes: [],
      script: '',criadoEm: tsFor(14, 9), atualizadoEm: tsFor(8, 11),
    },
    {
      id: 'l_10', colId: 'col_2', nome: 'Larissa Furtado', empresa: 'Imóveis Horizonte', telefone: '(85) 99977-3344', email: 'larissa@imoveishorizonte.com', valor: 2700, venc: in7days, responsavelId: 'u_joao', tag: 'imoveis' as const, prioridade: 'media' as const, origem: 'indicacao' as const, obs: 'Imobiliária com 10 corretores. Boa oportunidade de escala.',
      atividades: [
        { id: genId(), txt: 'Lead criado por indicação', tipo: 'criacao' as const, autorId: 'u_joao', autorNome: 'João Silva', ts: tsFor(3, 11) },
        { id: genId(), txt: 'Contato inicial realizado com interesse confirmado', tipo: 'ligacao' as const, autorId: 'u_joao', autorNome: 'João Silva', ts: tsFor(2, 15) },
      ],
      reunioes: [],
      script: COLS[1].script, criadoEm: tsFor(3, 11), atualizadoEm: tsFor(2, 15),
    },
  ]
}

export function runSeed(): void {
  if (isSeeded()) return
  setUsers(USERS)
  setCols(COLS)
  setTemplates(TEMPLATES)
  setCalls(buildCalls())
  setLeads(buildLeads() as any)
}
