let API_URL = "https://grade-horaria-backend.onrender.com";
let usuarioAtual = null;
let idEditando = null;
let ordemDias = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
let mesAtual = new Date().getMonth();
let anoAtual = new Date().getFullYear();

async function aoLogar(resposta) {
  let token = resposta.credential;

  let resultado = await fetch(API_URL + "/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: token })
  });

  let dados = await resultado.json();
  usuarioAtual = dados;

  localStorage.setItem("usuario", JSON.stringify(usuarioAtual));

  mostrarTelaPrincipal();
  buscarGrade();
}

function paraMinutos(horarioTexto) {
  let partes = horarioTexto.split(":");
  let horas = parseInt(partes[0]);
  let minutos = parseInt(partes[1]);
  return (horas * 60) + minutos;
}

async function cadastrar() {
  let materia = document.getElementById("campoMateria").value;
  let professor = document.getElementById("campoProfessor").value;
  let sala = document.getElementById("campoSala").value;
  let horario = document.getElementById("campoHorario").value;

  let checkboxesMarcados = document.querySelectorAll(".checkboxDia:checked");
  let diasSelecionados = [];

  for (let i = 0; i < checkboxesMarcados.length; i++) {
    diasSelecionados.push(checkboxesMarcados[i].value);
  }

  if (idEditando === null) {
    for (let i = 0; i < diasSelecionados.length; i++) {
      let aula = {
        materia: materia,
        professor: professor,
        sala: sala,
        dia: diasSelecionados[i],
        horario: horario,
        usuarioId: usuarioAtual.id
      };

      await fetch(API_URL + "/aulas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(aula)
      });
    }
  } else {
    let aula = {
      materia: materia,
      professor: professor,
      sala: sala,
      dia: diasSelecionados[0],
      horario: horario,
      usuarioId: usuarioAtual.id
    };

    await fetch(API_URL + "/aulas/" + idEditando, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(aula)
    });
    idEditando = null;
  }

  limparCampos();
  buscarGrade();
  buscarMaterias();
}

function limparCampos() {
  document.getElementById("campoMateria").value = "";
  document.getElementById("campoProfessor").value = "";
  document.getElementById("campoSala").value = "";
  document.getElementById("campoHorario").value = "";

  let checkboxes = document.querySelectorAll(".checkboxDia");
  for (let i = 0; i < checkboxes.length; i++) {
    checkboxes[i].checked = false;
  }
}

async function buscarGrade() {
  let resposta = await fetch(API_URL + "/aulas?usuarioId=" + usuarioAtual.id);
  let grade = await resposta.json();

  let horarios = [];
  for (let i = 0; i < grade.length; i++) {
    if (horarios.indexOf(grade[i].horario) === -1) {
      horarios.push(grade[i].horario);
    }
  }
  horarios.sort(function(a, b) {
    return paraMinutos(a) - paraMinutos(b);
  });

  let html = "<div class='grade-tabela'>";
  html += "<div class='celula cabecalho'></div>";
  for (let d = 0; d < ordemDias.length; d++) {
    html += "<div class='celula cabecalho'>" + ordemDias[d] + "</div>";
  }

  for (let h = 0; h < horarios.length; h++) {
    let horarioAtual = horarios[h];

    html += "<div class='celula horario-label'>" + horarioAtual + "</div>";

    for (let d = 0; d < ordemDias.length; d++) {
      let diaAtual = ordemDias[d];

      let aulaEncontrada = null;
      for (let i = 0; i < grade.length; i++) {
        if (grade[i].dia_semana === diaAtual && grade[i].horario === horarioAtual) {
          aulaEncontrada = grade[i];
        }
      }

      if (aulaEncontrada) {
        html += "<div class='celula aula-celula' onclick='iniciarEdicao(" + aulaEncontrada.id + ", \"" + aulaEncontrada.materia + "\", \"" + aulaEncontrada.professor + "\", \"" + aulaEncontrada.sala + "\", \"" + aulaEncontrada.dia_semana + "\", \"" + aulaEncontrada.horario + "\")'>" +
                    "<button class='btn-x' onclick='event.stopPropagation(); excluirAula(" + aulaEncontrada.id + ")'>×</button>" +
                    "<strong>" + aulaEncontrada.materia + "</strong>" +
                  "</div>";
      } else {
        html += "<div class='celula vazia'></div>";
      }
    }
  }

  html += "</div>";
  document.getElementById("areaGrade").innerHTML = html;
}

function iniciarEdicao(id, materia, professor, sala, dia, horario) {
  idEditando = id;
  document.getElementById("campoMateria").value = materia;
  document.getElementById("campoProfessor").value = professor;
  document.getElementById("campoSala").value = sala;
  document.getElementById("campoHorario").value = horario;

  let checkboxes = document.querySelectorAll(".checkboxDia");
  for (let i = 0; i < checkboxes.length; i++) {
    checkboxes[i].checked = (checkboxes[i].value === dia);
  }
}

async function excluirAula(id) {
  await fetch(API_URL + "/aulas/" + id, {
    method: "DELETE"
  });
  buscarGrade();
}

let usuarioSalvo = localStorage.getItem("usuario");
if (usuarioSalvo) {
  usuarioAtual = JSON.parse(usuarioSalvo);
  mostrarTelaPrincipal();
  buscarGrade();
}

function sair() {
  localStorage.removeItem("usuario");
  usuarioAtual = null;
  location.reload();
}

function mostrarTelaPrincipal() {
  document.getElementById("telaLogin").classList.add("escondido");
  document.getElementById("telaPrincipal").classList.remove("escondido");
  document.getElementById("nomeUsuario").textContent = "Olá, " + usuarioAtual.nome;
  mostrarAba("cadastro");
  buscarMaterias();
}

function mostrarTelaLogin() {
  document.getElementById("telaLogin").classList.remove("escondido");
  document.getElementById("telaPrincipal").classList.add("escondido");
}

function mostrarAba(nomeAba) {
  document.getElementById("abaCadastro").classList.add("escondido");
  document.getElementById("abaGrade").classList.add("escondido");
  document.getElementById("abaCalendario").classList.add("escondido");

  document.getElementById("botaoAbaCadastro").classList.remove("ativo");
  document.getElementById("botaoAbaGrade").classList.remove("ativo");
  document.getElementById("botaoAbaCalendario").classList.remove("ativo");

  if (nomeAba === "cadastro") {
    document.getElementById("abaCadastro").classList.remove("escondido");
    document.getElementById("botaoAbaCadastro").classList.add("ativo");
  } else if (nomeAba === "grade") {
    document.getElementById("abaGrade").classList.remove("escondido");
    document.getElementById("botaoAbaGrade").classList.add("ativo");
    buscarGrade();
  } else if (nomeAba === "calendario") {
    document.getElementById("abaCalendario").classList.remove("escondido");
    document.getElementById("botaoAbaCalendario").classList.add("ativo");
    gerarCalendario();
  }
}

async function buscarMaterias() {
  let resposta = await fetch(API_URL + "/aulas?usuarioId=" + usuarioAtual.id);
  let grade = await resposta.json();

  let chavesVistas = [];
  let materiasUnicas = [];

  for (let i = 0; i < grade.length; i++) {
    let aula = grade[i];
    let chave = aula.materia + "|" + aula.professor + "|" + aula.sala;

    if (chavesVistas.indexOf(chave) === -1) {
      chavesVistas.push(chave);
      materiasUnicas.push(aula);
    }
  }

  let html = "";
  for (let i = 0; i < materiasUnicas.length; i++) {
    let m = materiasUnicas[i];
    html += "<div class='cartao-materia'>" +
              "<strong>" + m.materia + "</strong><br>" +
              "Prof. " + m.professor + " — Sala " + m.sala +
            "</div>";
  }
  document.getElementById("areaMaterias").innerHTML = html;
}

async function gerarCalendario() {
  let nomesMeses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
                     "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  document.getElementById("tituloMes").textContent = nomesMeses[mesAtual] + " " + anoAtual;

  let primeiroDiaSemana = new Date(anoAtual, mesAtual, 1).getDay();
  let diasNoMes = new Date(anoAtual, mesAtual + 1, 0).getDate();

  let diasSemana = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  let resposta = await fetch(API_URL + "/eventos?usuarioId=" + usuarioAtual.id);
  let eventos = await resposta.json();

  let html = "";

  for (let i = 0; i < diasSemana.length; i++) {
    html += "<div class='celula-cal cabecalho-cal'>" + diasSemana[i] + "</div>";
  }

  for (let i = 0; i < primeiroDiaSemana; i++) {
    html += "<div class='celula-cal vazia-cal'></div>";
  }

  for (let dia = 1; dia <= diasNoMes; dia++) {
    let mesTexto = String(mesAtual + 1).padStart(2, "0");
    let diaTexto = String(dia).padStart(2, "0");
    let dataCompleta = anoAtual + "-" + mesTexto + "-" + diaTexto;

    let eventosDoDia = [];
    for (let i = 0; i < eventos.length; i++) {
      if (eventos[i].data === dataCompleta) {
        eventosDoDia.push(eventos[i]);
      }
    }

    html += "<div class='celula-cal dia-cal' onclick=\"criarEvento('" + dataCompleta + "')\">" +
              "<div class='numero-dia'>" + dia + "</div>";

    for (let i = 0; i < eventosDoDia.length; i++) {
      let ev = eventosDoDia[i];
      let classeTipo = ev.tipo === "prova" ? "evento-prova" : "evento-trabalho";
      html += "<div class='evento-cal " + classeTipo + "' onclick=\"event.stopPropagation(); excluirEvento(" + ev.id + ")\">" + ev.titulo + "</div>";
    }

    html += "</div>";
  }

  document.getElementById("areaCalendario").innerHTML = html;
}

function mudarMes(direcao) {
  mesAtual += direcao;

  if (mesAtual > 11) {
    mesAtual = 0;
    anoAtual++;
  } else if (mesAtual < 0) {
    mesAtual = 11;
    anoAtual--;
  }

  gerarCalendario();
}

async function criarEvento(data) {
  let titulo = prompt("Nome da prova/trabalho:");
  if (!titulo) return;

  let tipo = prompt("É prova ou trabalho? (digite 'prova' ou 'trabalho')");
  if (tipo !== "prova" && tipo !== "trabalho") {
    alert("Tipo inválido, tente novamente.");
    return;
  }

  let evento = {
    titulo: titulo,
    tipo: tipo,
    data: data,
    usuarioId: usuarioAtual.id
  };

  await fetch(API_URL + "/eventos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(evento)
  });

  gerarCalendario();
}

async function excluirEvento(id) {
  let confirmar = confirm("Excluir esse evento?");
  if (!confirmar) return;

  await fetch(API_URL + "/eventos/" + id, {
    method: "DELETE"
  });

  gerarCalendario();
}