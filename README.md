# Ensalamento UNIBRASIL — Front-end

Front-end do sistema de ensalamento (Projeto 1 — Prática Profissional em
Desenvolvimento Web). Feito em HTML, CSS e JavaScript puro (sem framework),
para depois se conectar a uma API em Java + Spring Boot + banco SQL.

## Como rodar localmente

Não precisa de instalação. Basta abrir o `index.html` num navegador, ou,
para evitar problemas de CORS/módulos no futuro, servir a pasta com um
servidor simples:

```bash
# Python já vem em praticamente qualquer máquina
python3 -m http.server 8000
# depois acesse http://localhost:8000
```

## Estrutura de arquivos

```
index.html          -> estrutura da página (login + casca do app)
css/style.css        -> todo o visual (cores, tipografia, layout)
js/data.js            -> dados de exemplo + camada "API" (funções que hoje
                         simulam requisições, e no futuro viram fetch())
js/auth.js            -> papéis (roles) e tabela de permissões
js/app.js              -> login simulado, navegação por abas, telas de
                          Início, Ensalamento, Salas, Turmas e Solicitações
js/calendar.js         -> aba de Calendário (visualização mensal + criação
                          de eventos)
```

## Papéis e permissões implementados

O controle de acesso fica todo centralizado em `js/auth.js`, no objeto
`PERMISSOES`. Cada tela do app chama `podeFazer("nomeDaPermissao")` antes
de mostrar um botão de ação — então, para mudar o que um papel pode fazer,
só é preciso editar essa tabela, sem mexer nas telas.

| Papel | Pode fazer |
|---|---|
| Aluno | Apenas visualizar (ensalamento, salas, calendário) |
| Professor | Alterar sala/horário de um encontro; adicionar eventos no calendário |
| Diretor de Curso | Mover alunos entre turmas; responder solicitações de troca; adicionar eventos |
| Monitor | Marcar/desmarcar a verificação de uma sala (quais salas podem abrir) |
| Aluno Representante | Criar solicitações de troca em nome da turma; adicionar eventos |

## Integração futura com o backend (Spring Boot)

Hoje, `js/data.js` guarda os dados em arrays na memória e o objeto `API`
devolve Promises que resolvem esses arrays. Quando o back-end estiver
pronto, basta trocar o corpo de cada função do objeto `API` por um
`fetch("/api/...")` real — o resto do front-end já está escrito esperando
uma Promise, então nenhuma tela precisa ser reescrita.

O login também está simulado (`js/auth.js`, seleção manual do papel na
tela inicial) até a autenticação federada (Google/Microsoft) ser
integrada pelo time de back-end.

## Observação importante sobre os papéis do projeto

O documento do Projeto 1 (seção 6.4) define quatro papéis oficiais:
**Administrador**, **Coordenador**, **Aluno** e **Professor** — com o
Administrador como único responsável por publicar o ensalamento. Os
papéis pedidos aqui (Diretor de Curso, Monitor, Aluno Representante)
não aparecem com esses nomes no documento. Isso não impede o projeto —
a seção 2.6 até incentiva ir além do mínimo — mas vale a pena, na área
"Sobre" do site e no relatório, explicar como esses papéis se encaixam
nos papéis oficiais (por exemplo: Diretor de Curso cobre o que o
documento chama de Coordenador, e acrescenta permissão de mover alunos
entre turmas; Monitor e Aluno Representante são papéis extras criados
pelo grupo). Isso evita perguntas complicadas na prova de autoria.
