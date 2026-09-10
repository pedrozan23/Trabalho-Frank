/* =========================================================================
   auth.js
   -------------------------------------------------------------------------
   Controla QUEM está usando o sistema e O QUE essa pessoa pode fazer.

   Segundo o projeto (seção 6.5 do PDF), o login de verdade vai ser feito
   por conta Google/Microsoft e o backend (Spring Boot) é quem vai dizer
   qual é o papel de cada e-mail. Como esse backend ainda não está pronto,
   aqui simulamos o login: a pessoa escolhe o papel numa tela inicial, e o
   sistema lembra a escolha usando localStorage (só para não perder o
   papel ao atualizar a página, isso NÃO é controle de acesso de verdade).

   Quando o backend estiver pronto, a ideia é substituir só a função
   fazerLogin() por uma chamada real (Google/Microsoft) e a função
   papelAtual() por um valor devolvido pela API - o resto do sistema
   (permissoes, menus, botões) continua igual, porque tudo já verifica
   a permissão a partir do papel, não a partir de "quem" está logado.
   ========================================================================= */

/* Lista de papéis existentes no sistema, de acordo com o pedido do grupo. */
const PAPEIS = {
  ALUNO: "aluno",
  PROFESSOR: "professor",
  DIRETOR_CURSO: "diretor_curso",
  MONITOR: "monitor",
  ALUNO_REPRESENTANTE: "aluno_representante",
};

/* Nomes de exibição (para aparecer na tela) de cada papel. */
const NOME_PAPEL = {
  [PAPEIS.ALUNO]: "Aluno",
  [PAPEIS.PROFESSOR]: "Professor",
  [PAPEIS.DIRETOR_CURSO]: "Diretor de Curso",
  [PAPEIS.MONITOR]: "Monitor",
  [PAPEIS.ALUNO_REPRESENTANTE]: "Aluno Representante",
};

/* -------------------------------------------------------------------------
   Tabela de permissões: para cada papel, o que ele pode fazer no sistema.
   Isso é o "sistema de controle por superioridade" pedido: cada ação do
   sistema (editar sala, mover aluno, etc.) confere aqui dentro se o papel
   atual tem "true" para aquela permissão, antes de deixar o usuário agir.
   ------------------------------------------------------------------------- */
const PERMISSOES = {
  [PAPEIS.ALUNO]: {
    verEnsalamento: true,
    editarEnsalamento: false,
    moverAlunoDeTurma: false,
    verificarSalas: false,
    solicitarTroca: false,
    responderSolicitacao: false,
    adicionarEvento: false,
  },
  [PAPEIS.PROFESSOR]: {
    verEnsalamento: true,
    editarEnsalamento: true,      // professor pode fazer mudanças (mover sala/horário)
    moverAlunoDeTurma: false,
    verificarSalas: false,
    solicitarTroca: false,
    responderSolicitacao: false,
    adicionarEvento: true,        // professor pode adicionar eventos no calendário
  },
  [PAPEIS.DIRETOR_CURSO]: {
    verEnsalamento: true,
    editarEnsalamento: false,
    moverAlunoDeTurma: true,      // diretor de curso: move alunos de turma em turma
    verificarSalas: false,
    solicitarTroca: false,
    responderSolicitacao: true,   // faz sentido o diretor decidir sobre as solicitações
    adicionarEvento: true,        // diretor de curso pode adicionar eventos
  },
  [PAPEIS.MONITOR]: {
    verEnsalamento: true,
    editarEnsalamento: false,
    moverAlunoDeTurma: false,
    verificarSalas: true,         // monitor verifica o sistema/salas que podem abrir
    solicitarTroca: false,
    responderSolicitacao: false,
    adicionarEvento: false,
  },
  [PAPEIS.ALUNO_REPRESENTANTE]: {
    verEnsalamento: true,
    editarEnsalamento: false,
    moverAlunoDeTurma: false,
    verificarSalas: false,
    solicitarTroca: true,         // pode solicitar trocas a pedido da turma
    responderSolicitacao: false,
    adicionarEvento: true,        // aluno representante pode adicionar eventos
  },
};

/* Chave usada no localStorage para lembrar o papel escolhido. */
const CHAVE_LOCALSTORAGE = "ensalamento_papel_atual";

/* Devolve o papel da pessoa logada (ou null se ninguém "logou" ainda). */
function papelAtual() {
  return localStorage.getItem(CHAVE_LOCALSTORAGE);
}

/* Simula o login: guarda o papel escolhido. */
function fazerLogin(papel) {
  localStorage.setItem(CHAVE_LOCALSTORAGE, papel);
}

/* Encerra a sessão simulada. */
function fazerLogout() {
  localStorage.removeItem(CHAVE_LOCALSTORAGE);
}

/* Verifica se o papel atual tem uma determinada permissão.
   Uso: podeFazer("editarEnsalamento") -> true ou false            */
function podeFazer(nomeDaPermissao) {
  const papel = papelAtual();
  if (!papel || !PERMISSOES[papel]) return false;
  return Boolean(PERMISSOES[papel][nomeDaPermissao]);
}
