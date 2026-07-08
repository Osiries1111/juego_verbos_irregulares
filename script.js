/* =========================================================
   ESTADO DEL JUEGO
   ========================================================= */
const estado = {
  verbos: [],
  indice: 0,
  puntaje: 0,
  totalPartidas: 10,
  cantidadElegida: 10,
  preguntas: [],
  historial: [] // { textoPregunta, tuRespuesta, respuestaCorrecta, acierto }
};

/* =========================================================
   REFERENCIAS AL DOM
   ========================================================= */
const dom = {
  config: document.getElementById("config"),
  juego: document.getElementById("juego"),
  final: document.getElementById("final"),

  opcionesCantidad: document.querySelectorAll(".opcion-cantidad"),
  cantidadPersonalizada: document.getElementById("cantidadPersonalizada"),
  btnComenzar: document.getElementById("btnComenzar"),

  progreso: document.getElementById("progreso"),
  pregunta: document.getElementById("pregunta"),
  respuesta: document.getElementById("respuesta"),
  btnVerificar: document.getElementById("btnVerificar"),
  resultado: document.getElementById("resultado"),

  mensajeFinal: document.getElementById("mensaje-final"),
  listaCorrectas: document.getElementById("listaCorrectas"),
  listaIncorrectas: document.getElementById("listaIncorrectas"),
  btnReiniciar: document.getElementById("btnReiniciar")
};

/* =========================================================
   CARGA DE DATOS
   ========================================================= */
function cargarVerbos() {
  return fetch("verbos.json")
    .then(res => res.json())
    .then(data => {
      estado.verbos = data;
    });
}

/* =========================================================
   PANTALLA DE CONFIGURACIÓN (elegir cantidad de preguntas)
   ========================================================= */
function inicializarSelectorCantidad() {
  dom.opcionesCantidad.forEach(btn => {
    btn.addEventListener("click", () => {
      dom.opcionesCantidad.forEach(b => b.classList.remove("seleccionada"));
      btn.classList.add("seleccionada");
      estado.cantidadElegida = parseInt(btn.dataset.valor, 10);
      dom.cantidadPersonalizada.value = "";
    });
  });

  dom.cantidadPersonalizada.addEventListener("input", (e) => {
    const val = parseInt(e.target.value, 10);
    if (val > 0) {
      dom.opcionesCantidad.forEach(b => b.classList.remove("seleccionada"));
      estado.cantidadElegida = val;
    }
  });
}

function comenzarJuego() {
  const personalizada = parseInt(dom.cantidadPersonalizada.value, 10);
  estado.totalPartidas = personalizada > 0 ? personalizada : estado.cantidadElegida;

  if (!estado.verbos.length) {
    // por si el fetch aún no termina, esperamos un poquito
    setTimeout(comenzarJuego, 200);
    return;
  }

  estado.indice = 0;
  estado.puntaje = 0;
  estado.preguntas = [];
  estado.historial = [];

  dom.config.style.display = "none";
  dom.final.style.display = "none";
  dom.juego.style.display = "block";

  generarPreguntas();
  mostrarPregunta();
}

/* =========================================================
   GENERACIÓN DE PREGUNTAS
   ========================================================= */
function generarPreguntas() {
  for (let i = 0; i < estado.totalPartidas; i++) {
    const fila = Math.floor(Math.random() * (estado.verbos.length - 1)) + 1;
    let col1 = Math.floor(Math.random() * 4);
    let col2;
    do {
      col2 = Math.floor(Math.random() * 4);
    } while (col1 === col2);
    estado.preguntas.push({ fila, col1, col2 });
  }
}

/* =========================================================
   BARRA DE PROGRESO
   ========================================================= */
function actualizarProgreso() {
  dom.progreso.innerHTML = "";
  for (let i = 0; i < estado.totalPartidas; i++) {
    const dot = document.createElement("span");
    if (i < estado.indice) dot.classList.add("hecha");
    if (i === estado.indice) dot.classList.add("actual");
    dom.progreso.appendChild(dot);
  }
}

/* =========================================================
   FLUJO DE PREGUNTAS
   ========================================================= */
function mostrarPregunta() {
  actualizarProgreso();
  const { fila, col1, col2 } = estado.preguntas[estado.indice];
  const pregunta = `${estado.verbos[0][col1]}: ${estado.verbos[fila][col1]} → ${estado.verbos[0][col2]}: `;
  dom.pregunta.textContent = pregunta;
  dom.respuesta.value = "";
  dom.resultado.textContent = "";
  dom.resultado.className = "";
  dom.respuesta.focus();
}

function verificar() {
  const resp = dom.respuesta.value.trim().toLowerCase();
  const { fila, col1, col2 } = estado.preguntas[estado.indice];
  const correcta = estado.verbos[fila][col2].toLowerCase();
  const acierto = resp === correcta;

  const textoPregunta = `${estado.verbos[0][col1]}: ${estado.verbos[fila][col1]} → ${estado.verbos[0][col2]}`;
  estado.historial.push({
    textoPregunta,
    tuRespuesta: dom.respuesta.value.trim() || "(en blanco)",
    respuestaCorrecta: estado.verbos[fila][col2],
    acierto
  });

  if (acierto) {
    estado.puntaje++;
    dom.resultado.textContent = "✅ ¡Correcto!";
    dom.resultado.className = "correcto";
  } else {
    dom.resultado.textContent = `❌ Incorrecto. La respuesta correcta era: ${estado.verbos[fila][col2]}`;
    dom.resultado.className = "incorrecto";
  }

  estado.indice++;
  if (estado.indice < estado.totalPartidas) {
    setTimeout(mostrarPregunta, 1500);
  } else {
    setTimeout(mostrarFinal, 1500);
  }
}

/* =========================================================
   PANTALLA FINAL Y RESUMEN
   ========================================================= */
function mostrarFinal() {
  actualizarProgreso();
  dom.juego.style.display = "none";
  dom.final.style.display = "block";

  const mensaje = estado.puntaje === estado.totalPartidas
    ? "¡Ganaste! ¡Sos un pro! 🏆"
    : `Obtuviste ${estado.puntaje} de ${estado.totalPartidas}. ¡Sigue practicando!`;
  dom.mensajeFinal.textContent = mensaje;

  renderizarResumen();
}

function renderizarResumen() {
  dom.listaCorrectas.innerHTML = "";
  dom.listaIncorrectas.innerHTML = "";

  estado.historial.forEach(item => {
    const li = document.createElement("li");
    if (item.acierto) {
      li.className = "item-resumen ok";
      li.innerHTML = `<span class="pregunta-texto">${item.textoPregunta}</span><span class="detalle-respuesta">Tu respuesta: ${item.tuRespuesta}</span>`;
      dom.listaCorrectas.appendChild(li);
    } else {
      li.className = "item-resumen mal";
      li.innerHTML = `<span class="pregunta-texto">${item.textoPregunta}</span><span class="detalle-respuesta">Escribiste: ${item.tuRespuesta} · Correcta: ${item.respuestaCorrecta}</span>`;
      dom.listaIncorrectas.appendChild(li);
    }
  });

  if (!dom.listaCorrectas.children.length) {
    dom.listaCorrectas.innerHTML = `<li class="item-resumen mal" style="text-align:center;">Ninguna esta vez, ¡la próxima será! 🌱</li>`;
  }
  if (!dom.listaIncorrectas.children.length) {
    dom.listaIncorrectas.innerHTML = `<li class="item-resumen ok" style="text-align:center;">¡Ninguna! Todo perfecto ✨</li>`;
  }
}

function reiniciar() {
  dom.final.style.display = "none";
  dom.config.style.display = "block";
}

/* =========================================================
   EVENTOS GLOBALES
   ========================================================= */
function inicializarEventos() {
  dom.btnComenzar.addEventListener("click", comenzarJuego);
  dom.btnVerificar.addEventListener("click", verificar);
  dom.btnReiniciar.addEventListener("click", reiniciar);

  dom.respuesta.addEventListener("keydown", (e) => {
    if (e.key === "Enter") verificar();
  });
}

/* =========================================================
   PUNTO DE ENTRADA
   ========================================================= */
document.addEventListener("DOMContentLoaded", () => {
  cargarVerbos();
  inicializarSelectorCantidad();
  inicializarEventos();
});