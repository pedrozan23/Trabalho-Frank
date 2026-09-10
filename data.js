/* =========================================================================
   data.js
   -------------------------------------------------------------------------
   Esta camada representa os dados que, no sistema final, virão do backend
   (Java + Spring Boot + banco SQL, conforme o Projeto 1). Por enquanto,
   como o backend ainda está em desenvolvimento pelo restante do grupo,
   os dados ficam guardados aqui mesmo, em memória (arrays), e as funções
   de acesso (API.getTurmas, API.getSalas, etc.) devolvem Promises.

   Por que Promises e não os arrays direto?
   Porque quando o backend estiver pronto, basta trocar o CORPO dessas
   funções por um "fetch('/api/...')" que também devolve uma Promise.
   O resto do front-end (app.js, calendar.js) não precisa mudar nada,
   pois já está escrito esperando uma Promise.
   ========================================================================= */

/* ---- SALAS ---------------------------------------------------------- */
/* status: "ativa" | "manutencao" | "desativada"                         */
/* verificada: usado pelo Monitor para indicar que já conferiu a sala    */
let SALAS = [
  { id: "S101", nome: "Sala 101", campus: "Sede Curitiba", predio: "Bloco A", andar: "1º andar",
    capacidade: 45, tipo: "Sala comum", recursos: ["Projetor", "Ar-condicionado"],
    acessibilidade: true, status: "ativa", verificada: true },
  { id: "S102", nome: "Sala 102", campus: "Sede Curitiba", predio: "Bloco A", andar: "1º andar",
    capacidade: 40, tipo: "Sala comum", recursos: ["Projetor"],
    acessibilidade: false, status: "ativa", verificada: false },
  { id: "LAB01", nome: "Laboratório de Informática 1", campus: "Sede Curitiba", predio: "Bloco B", andar: "Térreo",
    capacidade: 30, tipo: "Laboratório", recursos: ["Computadores", "Projetor", "Ar-condicionado"],
    acessibilidade: true, status: "ativa", verificada: true },
  { id: "AUD01", nome: "Auditório Central", campus: "Sede Curitiba", predio: "Bloco C", andar: "Térreo",
    capacidade: 120, tipo: "Auditório", recursos: ["Som", "Projetor", "Palco"],
    acessibilidade: true, status: "manutencao", verificada: false },
  { id: "S201", nome: "Sala 201", campus: "Sede Curitiba", predio: "Bloco A", andar: "2º andar",
    capacidade: 50, tipo: "Sala comum", recursos: ["Projetor"],
    acessibilidade: false, status: "ativa", verificada: false },
];

/* ---- TURMAS ----------------------------------------------------------- */
let TURMAS = [
  { id: "ESW-3A", curso: "Engenharia de Software", turno: "Noite", periodo: "3º período",
    tamanho: 38, professor: "Prof. Ricardo Melo" },
  { id: "ESW-3B", curso: "Engenharia de Software", turno: "Noite", periodo: "3º período",
    tamanho: 25, professor: "Prof.ª Camila Duarte" },
  { id: "ADM-2A", curso: "Administração", turno: "Manhã", periodo: "2º período",
    tamanho: 42, professor: "Prof. João Nakamura" },
];

/* ---- ENSALAMENTO (associação turma + sala + horário) ------------------ */
/* dia: 1=Segunda ... 5=Sexta                                             */
let ENSALAMENTO = [
  { id: "E1", turmaId: "ESW-3A", salaId: "S101", disciplina: "Prática Profissional em Dev. Web",
    dia: 2, horaInicio: "19:00", horaFim: "22:00", status: "confirmada" },
  { id: "E2", turmaId: "ESW-3B", salaId: "LAB01", disciplina: "Lógica de Programação",
    dia: 3, horaInicio: "19:00", horaFim: "22:00", status: "confirmada" },
  { id: "E3", turmaId: "ADM-2A", salaId: "S201", disciplina: "Gestão de Pessoas",
    dia: 1, horaInicio: "08:00", horaFim: "11:00", status: "confirmada" },
];

/* ---- SOLICITAÇÕES DE TROCA (feitas pelo aluno representante) ---------- */
/* status: "pendente" | "aprovada" | "recusada"                           */
let SOLICITACOES = [
  { id: "R1", turmaId: "ESW-3A", solicitante: "Aluno Representante - ESW-3A",
    motivo: "Sala atual não tem ar-condicionado e as aulas são à noite no verão.",
    status: "pendente", data: "2026-09-05" },
];

/* ---- EVENTOS DO CALENDÁRIO --------------------------------------------- */
let EVENTOS = [
  { id: "EV1", titulo: "Prova de Lógica de Programação", data: "2026-09-15",
    hora: "19:00", descricao: "Prova N1, sala LAB01.", autor: "Prof.ª Camila Duarte" },
  { id: "EV2", titulo: "Reunião de representantes de turma", data: "2026-09-18",
    hora: "12:00", descricao: "Pauta: pedidos de troca de sala.", autor: "Aluno Representante - ESW-3A" },
];

/* -------------------------------------------------------------------------
   "API" simulada: cada função devolve uma Promise, como um fetch() real.
   O setTimeout pequeno simula a latência de rede, só para o comportamento
   ficar parecido com o de produção (loading states, etc.).
   ------------------------------------------------------------------------- */
const API = {
  // ---- Leitura ----
  getSalas: () => simulaRede(() => [...SALAS]),
  getTurmas: () => simulaRede(() => [...TURMAS]),
  getEnsalamento: () => simulaRede(() => [...ENSALAMENTO]),
  getSolicitacoes: () => simulaRede(() => [...SOLICITACOES]),
  getEventos: () => simulaRede(() => [...EVENTOS]),

  // ---- Escrita (cada uma exige que o chamador já tenha checado a permissão) ----
  atualizarEnsalamento: (id, dadosNovos) => simulaRede(() => {
    const item = ENSALAMENTO.find(e => e.id === id);
    if (item) Object.assign(item, dadosNovos);
    return item;
  }),

  moverAlunoDeTurma: (turmaOrigemId, turmaDestinoId, quantidade) => simulaRede(() => {
    const origem = TURMAS.find(t => t.id === turmaOrigemId);
    const destino = TURMAS.find(t => t.id === turmaDestinoId);
    if (origem && destino && quantidade > 0 && origem.tamanho >= quantidade) {
      origem.tamanho -= quantidade;
      destino.tamanho += quantidade;
    }
    return { origem, destino };
  }),

  alternarVerificacaoSala: (salaId) => simulaRede(() => {
    const sala = SALAS.find(s => s.id === salaId);
    if (sala) sala.verificada = !sala.verificada;
    return sala;
  }),

  criarSolicitacao: (solicitacao) => simulaRede(() => {
    solicitacao.id = "R" + (SOLICITACOES.length + 1);
    solicitacao.status = "pendente";
    SOLICITACOES.push(solicitacao);
    return solicitacao;
  }),

  responderSolicitacao: (id, novoStatus) => simulaRede(() => {
    const solicitacao = SOLICITACOES.find(s => s.id === id);
    if (solicitacao) solicitacao.status = novoStatus;
    return solicitacao;
  }),

  criarEvento: (evento) => simulaRede(() => {
    evento.id = "EV" + (EVENTOS.length + 1);
    EVENTOS.push(evento);
    return evento;
  }),

  removerEvento: (id) => simulaRede(() => {
    EVENTOS = EVENTOS.filter(e => e.id !== id);
    return true;
  }),
};

/* Função auxiliar que transforma uma função comum em uma Promise,
   simulando o pequeno atraso de uma requisição de rede real. */
function simulaRede(funcao) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(funcao()), 150);
  });
}
