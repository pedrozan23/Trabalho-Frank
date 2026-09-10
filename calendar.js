/* =========================================================================
   calendar.js
   -------------------------------------------------------------------------
   Mostra um calendário mensal com os eventos cadastrados. A permissão
   "adicionarEvento" (Professor, Aluno Representante e Diretor de Curso,
   conforme definido em auth.js) controla quem vê o botão de adicionar
   evento. Aluno e Monitor só enxergam o calendário, sem poder editar.
   ========================================================================= */

/* Guarda o mês/ano que está sendo exibido no momento. */
let mesExibido = new Date().getMonth();      // 0 = Janeiro
let anoExibido = new Date().getFullYear();

const NOMES_MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

async function renderizarCalendario() {
  const main = document.getElementById("conteudo-principal");
  main.innerHTML = `<p>Carregando...</p>`;

  const eventos = await API.getEventos();
  const podeAdicionar = podeFazer("adicionarEvento");

  main.innerHTML = `
    <div class="cabecalho-pagina">
      <div>
        <h2>Calendário</h2>
        <p>Eventos acadêmicos e avisos relacionados às turmas.</p>
      </div>
      ${podeAdicionar ? `<button id="botao-novo-evento" class="botao-primario">Adicionar evento</button>` : ""}
    </div>
    ${!podeAdicionar ? `<div class="aviso-permissao">Seu papel (${NOME_PAPEL[papelAtual()]}) pode visualizar o calendário, mas não adicionar eventos.</div>` : ""}
    <div class="cartao">
      <div class="calendario-cabecalho">
        <button class="botao-secundario" id="mes-anterior">&larr; Anterior</button>
        <h3 id="titulo-mes-ano">${NOMES_MESES[mesExibido]} de ${anoExibido}</h3>
        <button class="botao-secundario" id="mes-seguinte">Próximo &rarr;</button>
      </div>
      <div class="grade-calendario" id="grade-calendario"></div>
    </div>
  `;

  desenharGradeDoMes(eventos);

  document.getElementById("mes-anterior").addEventListener("click", () => {
    mudarMes(-1);
    renderizarCalendario();
  });
  document.getElementById("mes-seguinte").addEventListener("click", () => {
    mudarMes(1);
    renderizarCalendario();
  });

  if (podeAdicionar) {
    document.getElementById("botao-novo-evento").addEventListener("click", abrirModalNovoEvento);
  }
}

function mudarMes(delta) {
  mesExibido += delta;
  if (mesExibido < 0) { mesExibido = 11; anoExibido--; }
  if (mesExibido > 11) { mesExibido = 0; anoExibido++; }
}

/* Monta os quadradinhos do mês, incluindo os dias "de fora" do mês
   apenas para preencher a grade de 7 colunas de forma alinhada. */
function desenharGradeDoMes(eventos) {
  const grade = document.getElementById("grade-calendario");
  grade.innerHTML = "";

  ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].forEach((nome) => {
    const cabecalho = document.createElement("div");
    cabecalho.className = "dia-semana-nome";
    cabecalho.textContent = nome;
    grade.appendChild(cabecalho);
  });

  const primeiroDiaDoMes = new Date(anoExibido, mesExibido, 1);
  const quantosDiasNoMes = new Date(anoExibido, mesExibido + 1, 0).getDate();
  const diaDaSemanaDoPrimeiro = primeiroDiaDoMes.getDay(); // 0=Domingo

  // Preenche os espaços vazios antes do dia 1
  for (let i = 0; i < diaDaSemanaDoPrimeiro; i++) {
    const vazio = document.createElement("div");
    vazio.className = "dia-calendario fora-do-mes";
    grade.appendChild(vazio);
  }

  for (let dia = 1; dia <= quantosDiasNoMes; dia++) {
    const dataFormatada = `${anoExibido}-${String(mesExibido + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
    const eventosDoDia = eventos.filter(e => e.data === dataFormatada);

    const celula = document.createElement("div");
    celula.className = "dia-calendario";
    celula.innerHTML = `
      <div class="numero-dia">${dia}</div>
      ${eventosDoDia.map(e => `<span class="evento-chip" title="${e.titulo} — ${e.descricao}">${e.hora} ${e.titulo}</span>`).join("")}
    `;
    grade.appendChild(celula);
  }
}

function abrirModalNovoEvento() {
  const fundo = document.createElement("div");
  fundo.className = "fundo-modal";
  fundo.innerHTML = `
    <div class="caixa-modal">
      <h3>Adicionar evento</h3>
      <label for="modal-titulo-evento">Título</label>
      <input id="modal-titulo-evento" type="text" placeholder="Ex: Prova N2" />
      <label for="modal-data-evento">Data</label>
      <input id="modal-data-evento" type="date" />
      <label for="modal-hora-evento">Hora</label>
      <input id="modal-hora-evento" type="time" />
      <label for="modal-descricao-evento">Descrição</label>
      <textarea id="modal-descricao-evento" rows="3" placeholder="Detalhes do evento..."></textarea>
      <div class="acoes-modal">
        <button class="botao-secundario" id="modal-cancelar-evento">Cancelar</button>
        <button class="botao-primario" id="modal-confirmar-evento">Salvar evento</button>
      </div>
    </div>
  `;
  document.body.appendChild(fundo);

  fundo.querySelector("#modal-cancelar-evento").addEventListener("click", () => fundo.remove());

  fundo.querySelector("#modal-confirmar-evento").addEventListener("click", async () => {
    const titulo = fundo.querySelector("#modal-titulo-evento").value.trim();
    const data = fundo.querySelector("#modal-data-evento").value;
    const hora = fundo.querySelector("#modal-hora-evento").value;
    const descricao = fundo.querySelector("#modal-descricao-evento").value.trim();

    if (!titulo || !data || !hora) {
      alert("Preencha ao menos o título, a data e a hora do evento.");
      return;
    }

    await API.criarEvento({
      titulo, data, hora, descricao,
      autor: `${NOME_PAPEL[papelAtual()]}`,
    });

    // Move o calendário para o mês do evento recém-criado, para o usuário ver o resultado.
    const [ano, mes] = data.split("-").map(Number);
    anoExibido = ano;
    mesExibido = mes - 1;

    fundo.remove();
    renderizarCalendario();
  });
}
