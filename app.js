/* =========================================================================
   app.js
   -------------------------------------------------------------------------
   Ponto de entrada da aplicação. Cuida de:
     1) Mostrar a tela de login ou a tela principal, dependendo se já
        existe um papel escolhido;
     2) Trocar de aba (Início, Ensalamento, Salas, Turmas, Solicitações);
     3) Renderizar o conteúdo de cada aba, sempre checando a permissão
        do papel atual antes de mostrar botões de ação.

   O calendário tem lógica própria e fica em js/calendar.js, chamado
   daqui quando a aba "Calendário" é aberta.
   ========================================================================= */

/* Nomes das abas visíveis para CADA papel. Todo mundo vê "Início" e
   "Ensalamento" e "Salas"; as demais abas só aparecem para quem usa. */
const DEFINICAO_ABAS = [
  { id: "inicio", rotulo: "Início", sempreVisivel: true },
  { id: "ensalamento", rotulo: "Ensalamento", sempreVisivel: true },
  { id: "salas", rotulo: "Salas", sempreVisivel: true },
  { id: "turmas", rotulo: "Turmas", permissaoParaVer: "moverAlunoDeTurma" },
  { id: "solicitacoes", rotulo: "Solicitações", permissaoParaVer: null, mostrarSe: (papel) =>
      papel === PAPEIS.ALUNO_REPRESENTANTE || papel === PAPEIS.DIRETOR_CURSO },
  { id: "calendario", rotulo: "Calendário", sempreVisivel: true },
];

let abaAtual = "inicio";

/* -------------------------------------------------------------------------
   Inicialização: decide se mostra login ou app.
   ------------------------------------------------------------------------- */
document.addEventListener("DOMContentLoaded", () => {
  if (papelAtual()) {
    iniciarApp();
  } else {
    mostrarTelaLogin();
  }
});

/* =========================================================================
   TELA DE LOGIN
   ========================================================================= */
function mostrarTelaLogin() {
  document.getElementById("tela-login").style.display = "flex";
  document.getElementById("app").style.display = "none";

  const listaPapeis = document.getElementById("lista-papeis");
  listaPapeis.innerHTML = "";

  const descricoes = {
    [PAPEIS.ALUNO]: "Consulta o ensalamento e a agenda da sua turma.",
    [PAPEIS.PROFESSOR]: "Consulta a agenda e pode alterar sala/horário de encontros.",
    [PAPEIS.DIRETOR_CURSO]: "Move alunos entre turmas e responde solicitações.",
    [PAPEIS.MONITOR]: "Verifica quais salas estão aptas a abrir.",
    [PAPEIS.ALUNO_REPRESENTANTE]: "Solicita trocas de sala/horário em nome da turma.",
  };

  Object.values(PAPEIS).forEach((papel) => {
    const botao = document.createElement("button");
    botao.className = "opcao-papel";
    botao.innerHTML = `
      <span>
        <span class="titulo-papel">${NOME_PAPEL[papel]}</span>
        <span class="descricao-papel">${descricoes[papel]}</span>
      </span>
      <span class="seta">&rarr;</span>
    `;
    botao.addEventListener("click", () => {
      fazerLogin(papel);
      iniciarApp();
    });
    listaPapeis.appendChild(botao);
  });
}

/* =========================================================================
   INICIALIZAÇÃO DO APP (depois do login)
   ========================================================================= */
function iniciarApp() {
  document.getElementById("tela-login").style.display = "none";
  document.getElementById("app").style.display = "flex";

  const papel = papelAtual();
  document.getElementById("selo-papel-atual").textContent = NOME_PAPEL[papel];

  document.getElementById("botao-sair").addEventListener("click", () => {
    fazerLogout();
    location.reload();
  });

  montarAbas();
  abrirAba("inicio");
}

/* Constrói os botões de aba de acordo com o que o papel atual pode ver. */
function montarAbas() {
  const papel = papelAtual();
  const nav = document.getElementById("nav-abas");
  nav.innerHTML = "";

  DEFINICAO_ABAS.forEach((aba) => {
    const podeVer = aba.sempreVisivel
      ? true
      : aba.mostrarSe
        ? aba.mostrarSe(papel)
        : podeFazer(aba.permissaoParaVer);

    if (!podeVer) return;

    const botao = document.createElement("button");
    botao.textContent = aba.rotulo;
    botao.dataset.aba = aba.id;
    botao.addEventListener("click", () => abrirAba(aba.id));
    nav.appendChild(botao);
  });
}

/* Troca de aba: atualiza destaque visual e chama a função de renderização certa. */
function abrirAba(idAba) {
  abaAtual = idAba;

  document.querySelectorAll("#nav-abas button").forEach((botao) => {
    botao.classList.toggle("ativa", botao.dataset.aba === idAba);
  });

  const funcoesPorAba = {
    inicio: renderizarInicio,
    ensalamento: renderizarEnsalamento,
    salas: renderizarSalas,
    turmas: renderizarTurmas,
    solicitacoes: renderizarSolicitacoes,
    calendario: renderizarCalendario, // definida em calendar.js
  };

  const funcao = funcoesPorAba[idAba];
  if (funcao) funcao();
}

/* =========================================================================
   ABA: INÍCIO
   ========================================================================= */
async function renderizarInicio() {
  const main = document.getElementById("conteudo-principal");
  main.innerHTML = `<p>Carregando...</p>`;

  const [ensalamento, turmas, salas] = await Promise.all([
    API.getEnsalamento(),
    API.getTurmas(),
    API.getSalas(),
  ]);

  const papel = papelAtual();
  const totalPendentes = (await API.getSolicitacoes()).filter(s => s.status === "pendente").length;
  const salasNaoVerificadas = salas.filter(s => s.status === "ativa" && !s.verificada).length;

  main.innerHTML = `
    <div class="cabecalho-pagina">
      <div>
        <h2>Bem-vindo(a), ${NOME_PAPEL[papel]}</h2>
        <p>Resumo rápido do ensalamento atual da instituição.</p>
      </div>
    </div>
    <div class="grade-cartoes">
      <div class="cartao">
        <h3>Encontros cadastrados</h3>
        <p style="font-size:1.8rem; font-weight:700; color:var(--azul-marinho); margin:6px 0;">${ensalamento.length}</p>
        <p style="color:var(--texto-secundario);">Turma + sala + horário já associados.</p>
      </div>
      <div class="cartao">
        <h3>Turmas ativas</h3>
        <p style="font-size:1.8rem; font-weight:700; color:var(--azul-marinho); margin:6px 0;">${turmas.length}</p>
        <p style="color:var(--texto-secundario);">Cadastradas no período letivo atual.</p>
      </div>
      <div class="cartao">
        <h3>Salas a verificar</h3>
        <p style="font-size:1.8rem; font-weight:700; color:var(--azul-marinho); margin:6px 0;">${salasNaoVerificadas}</p>
        <p style="color:var(--texto-secundario);">Salas ativas ainda sem verificação do monitor.</p>
      </div>
      <div class="cartao">
        <h3>Solicitações pendentes</h3>
        <p style="font-size:1.8rem; font-weight:700; color:var(--azul-marinho); margin:6px 0;">${totalPendentes}</p>
        <p style="color:var(--texto-secundario);">Pedidos de troca ainda sem resposta.</p>
      </div>
    </div>
  `;
}

/* =========================================================================
   ABA: ENSALAMENTO
   -------------------------------------------------------------------------
   Todos podem ver. Só quem tem a permissão "editarEnsalamento" (Professor)
   consegue trocar a sala/horário de um encontro pela própria tabela.
   ========================================================================= */
const NOMES_DIAS = { 1: "Segunda", 2: "Terça", 3: "Quarta", 4: "Quinta", 5: "Sexta" };

async function renderizarEnsalamento() {
  const main = document.getElementById("conteudo-principal");
  main.innerHTML = `<p>Carregando...</p>`;

  const [ensalamento, turmas, salas] = await Promise.all([
    API.getEnsalamento(), API.getTurmas(), API.getSalas(),
  ]);

  const podeEditar = podeFazer("editarEnsalamento");

  const linhas = ensalamento.map((e) => {
    const turma = turmas.find(t => t.id === e.turmaId);
    const opcoesSalas = salas
      .filter(s => s.status === "ativa")
      .map(s => `<option value="${s.id}" ${s.id === e.salaId ? "selected" : ""}>${s.nome}</option>`)
      .join("");

    return `
      <tr>
        <td>${turma ? turma.id : e.turmaId}</td>
        <td>${e.disciplina}</td>
        <td>${NOMES_DIAS[e.dia]}, ${e.horaInicio}–${e.horaFim}</td>
        <td>
          ${podeEditar
            ? `<select data-encontro="${e.id}" class="seletor-sala">${opcoesSalas}</select>`
            : (salas.find(s => s.id === e.salaId)?.nome || e.salaId)}
        </td>
        <td><span class="selo selo-ok">${e.status}</span></td>
      </tr>
    `;
  }).join("");

  main.innerHTML = `
    <div class="cabecalho-pagina">
      <div>
        <h2>Ensalamento</h2>
        <p>Associação entre turmas, disciplinas, horários e salas.</p>
      </div>
    </div>
    ${!podeEditar ? `<div class="aviso-permissao">Seu papel (${NOME_PAPEL[papelAtual()]}) tem acesso somente de leitura a esta tabela.</div>` : ""}
    <div class="cartao">
      <table class="tabela-padrao">
        <thead>
          <tr><th>Turma</th><th>Disciplina</th><th>Horário</th><th>Sala</th><th>Status</th></tr>
        </thead>
        <tbody>${linhas}</tbody>
      </table>
    </div>
  `;

  if (podeEditar) {
    document.querySelectorAll(".seletor-sala").forEach((select) => {
      select.addEventListener("change", async (evento) => {
        const idEncontro = evento.target.dataset.encontro;
        await API.atualizarEnsalamento(idEncontro, { salaId: evento.target.value });
        renderizarEnsalamento(); // recarrega a tabela com o dado novo
      });
    });
  }
}

/* =========================================================================
   ABA: SALAS
   -------------------------------------------------------------------------
   Todos podem ver os detalhes das salas. Só quem tem a permissão
   "verificarSalas" (Monitor) consegue marcar/desmarcar a verificação.
   ========================================================================= */
async function renderizarSalas() {
  const main = document.getElementById("conteudo-principal");
  main.innerHTML = `<p>Carregando...</p>`;

  const salas = await API.getSalas();
  const podeVerificar = podeFazer("verificarSalas");

  const selosStatus = {
    ativa: '<span class="selo selo-ok">Ativa</span>',
    manutencao: '<span class="selo selo-alerta">Em manutenção</span>',
    desativada: '<span class="selo selo-erro">Desativada</span>',
  };

  const cartoes = salas.map((s) => `
    <div class="cartao">
      <h3>${s.nome}</h3>
      <p style="color:var(--texto-secundario); margin:0 0 8px;">${s.predio} · ${s.andar} · ${s.campus}</p>
      <p style="margin:4px 0;">Capacidade: <strong>${s.capacidade}</strong> · Tipo: ${s.tipo}</p>
      <p style="margin:4px 0;">Recursos: ${s.recursos.join(", ") || "Nenhum cadastrado"}</p>
      <p style="margin:4px 0;">Acessibilidade: ${s.acessibilidade ? "Sim" : "Não"}</p>
      <div style="margin-top:10px; display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
        ${selosStatus[s.status]}
        ${s.verificada
          ? '<span class="selo selo-ok">Verificada pelo monitor</span>'
          : '<span class="selo selo-alerta">Aguardando verificação</span>'}
      </div>
      ${podeVerificar ? `
        <button class="botao-secundario" style="margin-top:12px;" data-sala="${s.id}">
          ${s.verificada ? "Desmarcar verificação" : "Marcar como verificada"}
        </button>` : ""}
    </div>
  `).join("");

  main.innerHTML = `
    <div class="cabecalho-pagina">
      <div>
        <h2>Salas</h2>
        <p>Estrutura física cadastrada: campus, prédios e salas.</p>
      </div>
    </div>
    ${!podeVerificar ? `<div class="aviso-permissao">Apenas o papel Monitor pode marcar a verificação de uma sala.</div>` : ""}
    <div class="grade-cartoes">${cartoes}</div>
  `;

  if (podeVerificar) {
    main.querySelectorAll("button[data-sala]").forEach((botao) => {
      botao.addEventListener("click", async () => {
        await API.alternarVerificacaoSala(botao.dataset.sala);
        renderizarSalas();
      });
    });
  }
}

/* =========================================================================
   ABA: TURMAS (só aparece para quem pode mover alunos: Diretor de Curso)
   ========================================================================= */
async function renderizarTurmas() {
  const main = document.getElementById("conteudo-principal");
  main.innerHTML = `<p>Carregando...</p>`;

  const turmas = await API.getTurmas();
  const podeMover = podeFazer("moverAlunoDeTurma");

  const opcoesTurmas = (excetoId) => turmas
    .filter(t => t.id !== excetoId)
    .map(t => `<option value="${t.id}">${t.id} — ${t.curso}</option>`)
    .join("");

  const linhas = turmas.map((t) => `
    <tr>
      <td>${t.id}</td>
      <td>${t.curso}</td>
      <td>${t.periodo} · ${t.turno}</td>
      <td>${t.tamanho} alunos</td>
      <td>${t.professor}</td>
      ${podeMover ? `
        <td>
          <button class="botao-secundario" data-mover-de="${t.id}">Mover aluno(s) daqui</button>
        </td>` : ""}
    </tr>
  `).join("");

  main.innerHTML = `
    <div class="cabecalho-pagina">
      <div>
        <h2>Turmas</h2>
        <p>Como Diretor de Curso, você pode mover alunos de uma turma para outra.</p>
      </div>
    </div>
    <div class="cartao">
      <table class="tabela-padrao">
        <thead>
          <tr><th>Turma</th><th>Curso</th><th>Período/Turno</th><th>Tamanho</th><th>Professor</th>${podeMover ? "<th>Ação</th>" : ""}</tr>
        </thead>
        <tbody>${linhas}</tbody>
      </table>
    </div>
    <div id="area-form-mover"></div>
  `;

  if (podeMover) {
    main.querySelectorAll("button[data-mover-de]").forEach((botao) => {
      botao.addEventListener("click", () => {
        const origemId = botao.dataset.moverDe;
        document.getElementById("area-form-mover").innerHTML = `
          <div class="cartao">
            <h3>Mover aluno(s) de ${origemId}</h3>
            <label for="select-turma-destino">Turma de destino</label>
            <select id="select-turma-destino">${opcoesTurmas(origemId)}</select>
            <label for="input-quantidade">Quantidade de alunos</label>
            <input id="input-quantidade" type="number" min="1" value="1" />
            <div class="acoes-modal" style="justify-content:flex-start; margin-top:14px;">
              <button id="botao-confirmar-mover" class="botao-primario">Confirmar movimentação</button>
            </div>
          </div>
        `;
        document.getElementById("botao-confirmar-mover").addEventListener("click", async () => {
          const destinoId = document.getElementById("select-turma-destino").value;
          const quantidade = parseInt(document.getElementById("input-quantidade").value, 10);
          await API.moverAlunoDeTurma(origemId, destinoId, quantidade);
          renderizarTurmas();
        });
      });
    });
  }
}

/* =========================================================================
   ABA: SOLICITAÇÕES DE TROCA
   -------------------------------------------------------------------------
   Aluno representante cria a solicitação (pede troca em nome da turma).
   Diretor de curso decide (aprova/recusa).
   ========================================================================= */
async function renderizarSolicitacoes() {
  const main = document.getElementById("conteudo-principal");
  main.innerHTML = `<p>Carregando...</p>`;

  const [solicitacoes, turmas] = await Promise.all([API.getSolicitacoes(), API.getTurmas()]);
  const podeCriar = podeFazer("solicitarTroca");
  const podeResponder = podeFazer("responderSolicitacao");

  const selosStatus = {
    pendente: '<span class="selo selo-alerta">Pendente</span>',
    aprovada: '<span class="selo selo-ok">Aprovada</span>',
    recusada: '<span class="selo selo-erro">Recusada</span>',
  };

  const linhas = solicitacoes.map((s) => `
    <tr>
      <td>${s.turmaId}</td>
      <td>${s.motivo}</td>
      <td>${s.solicitante}</td>
      <td>${selosStatus[s.status]}</td>
      ${podeResponder ? `
        <td>
          ${s.status === "pendente" ? `
            <button class="botao-secundario" data-responder="${s.id}" data-status="aprovada">Aprovar</button>
            <button class="botao-secundario" data-responder="${s.id}" data-status="recusada">Recusar</button>
          ` : "—"}
        </td>` : ""}
    </tr>
  `).join("");

  main.innerHTML = `
    <div class="cabecalho-pagina">
      <div>
        <h2>Solicitações de troca</h2>
        <p>Pedidos de troca de sala/horário, feitos pelo aluno representante em nome da turma.</p>
      </div>
      ${podeCriar ? `<button id="botao-nova-solicitacao" class="botao-primario">Nova solicitação</button>` : ""}
    </div>
    <div class="cartao">
      <table class="tabela-padrao">
        <thead>
          <tr><th>Turma</th><th>Motivo</th><th>Solicitante</th><th>Status</th>${podeResponder ? "<th>Ação</th>" : ""}</tr>
        </thead>
        <tbody>${linhas || `<tr><td colspan="5">Nenhuma solicitação registrada.</td></tr>`}</tbody>
      </table>
    </div>
  `;

  if (podeCriar) {
    document.getElementById("botao-nova-solicitacao").addEventListener("click", () => {
      abrirModalNovaSolicitacao(turmas);
    });
  }

  if (podeResponder) {
    main.querySelectorAll("button[data-responder]").forEach((botao) => {
      botao.addEventListener("click", async () => {
        await API.responderSolicitacao(botao.dataset.responder, botao.dataset.status);
        renderizarSolicitacoes();
      });
    });
  }
}

function abrirModalNovaSolicitacao(turmas) {
  const opcoesTurmas = turmas.map(t => `<option value="${t.id}">${t.id} — ${t.curso}</option>`).join("");

  const fundo = document.createElement("div");
  fundo.className = "fundo-modal";
  fundo.innerHTML = `
    <div class="caixa-modal">
      <h3>Nova solicitação de troca</h3>
      <label for="modal-turma">Turma</label>
      <select id="modal-turma">${opcoesTurmas}</select>
      <label for="modal-motivo">Motivo</label>
      <textarea id="modal-motivo" rows="3" placeholder="Explique o motivo do pedido de troca..."></textarea>
      <div class="acoes-modal">
        <button class="botao-secundario" id="modal-cancelar">Cancelar</button>
        <button class="botao-primario" id="modal-confirmar">Enviar solicitação</button>
      </div>
    </div>
  `;
  document.body.appendChild(fundo);

  fundo.querySelector("#modal-cancelar").addEventListener("click", () => fundo.remove());

  fundo.querySelector("#modal-confirmar").addEventListener("click", async () => {
    const turmaId = fundo.querySelector("#modal-turma").value;
    const motivo = fundo.querySelector("#modal-motivo").value.trim();
    if (!motivo) {
      alert("Descreva o motivo da solicitação.");
      return;
    }
    await API.criarSolicitacao({
      turmaId,
      motivo,
      solicitante: `Aluno Representante - ${turmaId}`,
      data: new Date().toISOString().slice(0, 10),
    });
    fundo.remove();
    renderizarSolicitacoes();
  });
}
