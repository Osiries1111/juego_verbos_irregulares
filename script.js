/* =========================================================
   CONSTANTES
   ========================================================= */
// Orden fijo de columnas en verbos.json: Infinitive, Simple Past, Past Participle, Castellano
const NUM_COLUMNAS = 4;

/* =========================================================
   ESTADO DEL JUEGO
   ========================================================= */
const estado = {
  verbos: [],

  modo: "quiz", // "quiz" | "fila"

  // configuración elegida por el usuario
  columnasQuizSeleccionadas: new Set(), // qué columnas practicar escribiendo (modo quiz) — arranca vacío
  columnaFilaConocida: 0,                            // qué columna ya se muestra dada (modo fila)
  cantidadElegida: 10,
  totalPartidas: 10, // número de verbos/filas a practicar (no de campos individuales)

  // progreso de la partida
  indice: 0,
  puntaje: 0,          // campos individuales correctos
  totalCampos: 0,      // campos individuales totales (para el mensaje final)
  preguntas: [],        // en modo quiz: {fila, col1, col2} | en modo fila: {fila, colDada, colsAPreguntar}
  historial: []          // { textoPregunta, tuRespuesta, respuestaCorrecta, acierto } — común a ambos modos
};

/* =========================================================
   REFERENCIAS AL DOM
   ========================================================= */
const dom = {
  config: document.getElementById("config"),
  final: document.getElementById("final"),

  opcionesModo: document.querySelectorAll(".opcion-modo"),
  bloqueColumnasQuiz: document.getElementById("bloqueColumnasQuiz"),
  bloqueColumnaFila: document.getElementById("bloqueColumnaFila"),
  opcionesColumnasQuiz: document.querySelectorAll("#opcionesColumnasQuiz .opcion-columna"),
  opcionesColumnaFila: document.querySelectorAll("#opcionesColumnaFila .opcion-columna"),
  avisoColumnasQuiz: document.getElementById("avisoColumnasQuiz"),

  opcionesCantidad: document.querySelectorAll(".opcion-cantidad"),
  cantidadPersonalizada: document.getElementById("cantidadPersonalizada"),
  btnComenzar: document.getElementById("btnComenzar"),

  // modo quiz
  juegoQuiz: document.getElementById("juegoQuiz"),
  progresoQuiz: document.getElementById("progresoQuiz"),
  pregunta: document.getElementById("pregunta"),
  respuesta: document.getElementById("respuesta"),
  btnVerificar: document.getElementById("btnVerificar"),
  resultado: document.getElementById("resultado"),

  // modo completar fila
  juegoFila: document.getElementById("juegoFila"),
  progresoFila: document.getElementById("progresoFila"),
  filaDadaEtiqueta: document.getElementById("filaDadaEtiqueta"),
  filaDadaValor: document.getElementById("filaDadaValor"),
  camposFila: document.getElementById("camposFila"),
  btnVerificarFila: document.getElementById("btnVerificarFila"),
  resultadoFila: document.getElementById("resultadoFila"),

  // final
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
   CONFIGURACIÓN: SELECTOR DE MODO
   ========================================================= */
function inicializarSelectorModo() {
  dom.opcionesModo.forEach(btn => {
    btn.addEventListener("click", () => {
      dom.opcionesModo.forEach(b => b.classList.remove("seleccionada"));
      btn.classList.add("seleccionada");
      estado.modo = btn.dataset.modo;

      const esFila = estado.modo === "fila";
      dom.bloqueColumnasQuiz.style.display = esFila ? "none" : "block";
      dom.bloqueColumnaFila.style.display = esFila ? "block" : "none";
    });
  });
}

/* =========================================================
   CONFIGURACIÓN: COLUMNAS (quiz = multi-select, fila = single-select)
   ========================================================= */
function inicializarSelectorColumnas() {
  // Quiz: multi-select libre. Arranca vacío; se valida al presionar "Comenzar".
  dom.opcionesColumnasQuiz.forEach(btn => {
    btn.addEventListener("click", () => {
      const col = parseInt(btn.dataset.col, 10);
      const yaSeleccionada = estado.columnasQuizSeleccionadas.has(col);

      if (yaSeleccionada) {
        estado.columnasQuizSeleccionadas.delete(col);
        btn.classList.remove("seleccionada");
      } else {
        estado.columnasQuizSeleccionadas.add(col);
        btn.classList.add("seleccionada");
      }

      if (estado.columnasQuizSeleccionadas.size > 0) {
        dom.avisoColumnasQuiz.classList.remove("mostrar");
      }
    });
  });

  // Fila: single-select
  dom.opcionesColumnaFila.forEach(btn => {
    btn.addEventListener("click", () => {
      dom.opcionesColumnaFila.forEach(b => b.classList.remove("seleccionada"));
      btn.classList.add("seleccionada");
      estado.columnaFilaConocida = parseInt(btn.dataset.col, 10);
    });
  });
}

/* =========================================================
   CONFIGURACIÓN: CANTIDAD DE PREGUNTAS
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

/* =========================================================
   INICIO DEL JUEGO
   ========================================================= */
function comenzarJuego() {
  if (estado.modo === "quiz" && estado.columnasQuizSeleccionadas.size === 0) {
    dom.avisoColumnasQuiz.classList.add("mostrar");
    return;
  }

  const personalizada = parseInt(dom.cantidadPersonalizada.value, 10);
  estado.totalPartidas = personalizada > 0 ? personalizada : estado.cantidadElegida;

  if (!estado.verbos.length) {
    // por si el fetch aún no termina, esperamos un poquito
    setTimeout(comenzarJuego, 200);
    return;
  }

  estado.indice = 0;
  estado.puntaje = 0;
  estado.totalCampos = 0;
  estado.preguntas = [];
  estado.historial = [];

  dom.config.style.display = "none";
  dom.final.style.display = "none";
  dom.juegoQuiz.style.display = "none";
  dom.juegoFila.style.display = "none";

  if (estado.modo === "fila") {
    estado.totalCampos = estado.totalPartidas * (NUM_COLUMNAS - 1);
    generarPreguntasFila();
    dom.juegoFila.style.display = "block";
    mostrarFila();
  } else {
    estado.totalCampos = estado.totalPartidas;
    generarPreguntasQuiz();
    dom.juegoQuiz.style.display = "block";
    mostrarPregunta();
  }
}

/* =========================================================
   MODO QUIZ RÁPIDO
   ========================================================= */
function generarPreguntasQuiz() {
  const columnasObjetivo = Array.from(estado.columnasQuizSeleccionadas);

  for (let i = 0; i < estado.totalPartidas; i++) {
    const fila = Math.floor(Math.random() * (estado.verbos.length - 1)) + 1;
    const col2 = columnasObjetivo[Math.floor(Math.random() * columnasObjetivo.length)];

    let col1;
    do {
      col1 = Math.floor(Math.random() * NUM_COLUMNAS);
    } while (col1 === col2);

    estado.preguntas.push({ fila, col1, col2 });
  }
}

function actualizarProgreso(elemento) {
  elemento.innerHTML = "";
  for (let i = 0; i < estado.totalPartidas; i++) {
    const dot = document.createElement("span");
    if (i < estado.indice) dot.classList.add("hecha");
    if (i === estado.indice) dot.classList.add("actual");
    elemento.appendChild(dot);
  }
}

function mostrarPregunta() {
  actualizarProgreso(dom.progresoQuiz);
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
   MODO COMPLETAR FILA
   ========================================================= */
function generarPreguntasFila() {
  const colDada = estado.columnaFilaConocida;
  const colsAPreguntar = [];
  for (let c = 0; c < NUM_COLUMNAS; c++) {
    if (c !== colDada) colsAPreguntar.push(c);
  }

  for (let i = 0; i < estado.totalPartidas; i++) {
    const fila = Math.floor(Math.random() * (estado.verbos.length - 1)) + 1;
    estado.preguntas.push({ fila, colDada, colsAPreguntar });
  }
}

function mostrarFila() {
  actualizarProgreso(dom.progresoFila);
  const { fila, colDada, colsAPreguntar } = estado.preguntas[estado.indice];

  dom.filaDadaEtiqueta.textContent = estado.verbos[0][colDada];
  dom.filaDadaValor.textContent = estado.verbos[fila][colDada];

  dom.camposFila.innerHTML = "";
  colsAPreguntar.forEach(col => {
    const contenedor = document.createElement("div");
    contenedor.className = "campo-fila-item";
    contenedor.innerHTML = `
      <label>${estado.verbos[0][col]}</label>
      <input type="text" data-col="${col}" autocomplete="off" />
      <span class="feedback-fila"></span>
    `;
    dom.camposFila.appendChild(contenedor);
  });

  dom.resultadoFila.textContent = "";
  dom.resultadoFila.className = "";

  const primerInput = dom.camposFila.querySelector("input");
  if (primerInput) primerInput.focus();
}

function verificarFila() {
  const { fila, colDada, colsAPreguntar } = estado.preguntas[estado.indice];
  const inputs = dom.camposFila.querySelectorAll("input");
  let aciertosEnFila = 0;

  const valorDado = estado.verbos[fila][colDada];

  inputs.forEach(input => {
    const col = parseInt(input.dataset.col, 10);
    const resp = input.value.trim().toLowerCase();
    const correcta = estado.verbos[fila][col].toLowerCase();
    const acierto = resp === correcta;
    const feedback = input.nextElementSibling;

    input.classList.remove("correcta", "incorrecta");
    input.classList.add(acierto ? "correcta" : "incorrecta");

    if (acierto) {
      aciertosEnFila++;
      feedback.textContent = "✅ Correcto";
      feedback.className = "feedback-fila ok";
    } else {
      feedback.textContent = `❌ Era: ${estado.verbos[fila][col]}`;
      feedback.className = "feedback-fila mal";
    }

    estado.historial.push({
      textoPregunta: `${estado.verbos[0][colDada]}: ${valorDado} → ${estado.verbos[0][col]}`,
      tuRespuesta: input.value.trim() || "(en blanco)",
      respuestaCorrecta: estado.verbos[fila][col],
      acierto
    });
  });

  estado.puntaje += aciertosEnFila;

  if (aciertosEnFila === colsAPreguntar.length) {
    dom.resultadoFila.textContent = "✅ ¡Fila completa correcta!";
    dom.resultadoFila.className = "correcto";
  } else if (aciertosEnFila === 0) {
    dom.resultadoFila.textContent = "❌ Ninguna coincidió, ¡sigue intentando!";
    dom.resultadoFila.className = "incorrecto";
  } else {
    dom.resultadoFila.textContent = `Acertaste ${aciertosEnFila} de ${colsAPreguntar.length}`;
    dom.resultadoFila.className = "mixto";
  }

  estado.indice++;
  if (estado.indice < estado.totalPartidas) {
    setTimeout(mostrarFila, 1800);
  } else {
    setTimeout(mostrarFinal, 1800);
  }
}

/* =========================================================
   PANTALLA FINAL Y RESUMEN (compartida por ambos modos)
   ========================================================= */
function mostrarFinal() {
  dom.juegoQuiz.style.display = "none";
  dom.juegoFila.style.display = "none";
  dom.final.style.display = "block";

  const mensaje = estado.puntaje === estado.totalCampos
    ? "¡Ganaste! ¡Sos un pro! 🏆"
    : `Obtuviste ${estado.puntaje} de ${estado.totalCampos}. ¡Sigue practicando!`;
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
  dom.btnReiniciar.addEventListener("click", reiniciar);

  // modo quiz
  dom.btnVerificar.addEventListener("click", verificar);
  dom.respuesta.addEventListener("keydown", (e) => {
    if (e.key === "Enter") verificar();
  });

  // modo completar fila
  dom.btnVerificarFila.addEventListener("click", verificarFila);
  dom.camposFila.addEventListener("keydown", (e) => {
    if (e.key === "Enter") verificarFila();
  });
}

/* =========================================================
   PUNTO DE ENTRADA
   ========================================================= */
document.addEventListener("DOMContentLoaded", () => {
  cargarVerbos();
  inicializarSelectorModo();
  inicializarSelectorColumnas();
  inicializarSelectorCantidad();
  inicializarEventos();
});