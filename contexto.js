/* ============================================================
   MODO EN CONTEXTO — módulo aislado.
   Practica elegir la forma verbal correcta según el contexto de
   una oración. Las frases viven en frases.csv (fácil de ampliar).

   Se comunica hacia afuera solo con:
     - window.IniciarContexto(opciones)  ← llamada de entrada
     - evento "contextoVolverAlMenu"     ← salida (volver al menú)
   ============================================================ */
(function () {
  "use strict";

  const MAPA_COLUMNAS = { infinitivo: 0, pasado: 1, participio: 2 };

  /* -------- parser CSV mínimo (soporta comas y comillas dentro de campos) -------- */
  function parsearCSV(texto) {
    const filas = [];
    let fila = [];
    let campo = "";
    let entreComillas = false;

    for (let i = 0; i < texto.length; i++) {
      const c = texto[i];
      if (entreComillas) {
        if (c === '"') {
          if (texto[i + 1] === '"') { campo += '"'; i++; }
          else { entreComillas = false; }
        } else {
          campo += c;
        }
      } else if (c === '"') {
        entreComillas = true;
      } else if (c === ",") {
        fila.push(campo);
        campo = "";
      } else if (c === "\n" || c === "\r") {
        if (c === "\r" && texto[i + 1] === "\n") i++;
        fila.push(campo);
        campo = "";
        if (fila.length > 1 || fila[0] !== "") filas.push(fila);
        fila = [];
      } else {
        campo += c;
      }
    }
    if (campo !== "" || fila.length) {
      fila.push(campo);
      filas.push(fila);
    }
    return filas;
  }

  function cargarPlantillas() {
    return fetch("frases.csv")
      .then(res => res.text())
      .then(texto => {
        const filas = parsearCSV(texto);
        const [encabezado, ...datos] = filas;
        const idx = {
          frase: encabezado.indexOf("frase"),
          columna: encabezado.indexOf("columna"),
          pista: encabezado.indexOf("pista"),
          tipo: encabezado.indexOf("tipo"),
          verboCorrecto: encabezado.indexOf("verbo_correcto"),
          distractores: encabezado.indexOf("distractores")
        };

        return datos
          .filter(f => f[idx.frase] && f[idx.frase].trim() !== "")
          .map(f => ({
            texto: f[idx.frase],
            col: MAPA_COLUMNAS[(f[idx.columna] || "").trim()] ?? 1,
            pista: f[idx.pista] || "",
            tipo: (f[idx.tipo] || "mismo_verbo").trim() || "mismo_verbo",
            verboCorrecto: (f[idx.verboCorrecto] || "").trim().toLowerCase(),
            distractores: (f[idx.distractores] || "")
              .split("|")
              .map(v => v.trim().toLowerCase())
              .filter(Boolean)
          }));
      });
  }

  /* -------- referencias al DOM propias de este módulo -------- */
  const dom = {
    progreso: document.getElementById("progresoContexto"),
    oracion: document.getElementById("contextoOracion"),
    opciones: document.getElementById("contextoOpciones"),
    btnSiguiente: document.getElementById("contextoBtnSiguiente"),
    juegoWrap: document.getElementById("contextoJuegoWrap"),
    final: document.getElementById("contextoFinal"),
    finalMensaje: document.getElementById("contextoFinalMensaje"),
    listaCorrectas: document.getElementById("contextoListaCorrectas"),
    listaIncorrectas: document.getElementById("contextoListaIncorrectas"),
    btnReintentar: document.getElementById("contextoBtnReintentar"),
    btnMenu: document.getElementById("contextoBtnMenu")
  };

  let plantillas = [];
  let estado = null;
  let opcionesGuardadas = null;

  cargarPlantillas().then(datos => {
    plantillas = datos;
  });

  /* -------- entrada pública -------- */
  function iniciar(opciones) {
    opcionesGuardadas = opciones;

    if (!plantillas.length) {
      // por si el fetch del csv aún no termina, esperamos un poquito
      setTimeout(() => iniciar(opciones), 200);
      return;
    }

    estado = {
      verbos: opciones.verbos,
      cantidad: Math.max(1, opciones.cantidad || 10),
      indice: 0,
      puntaje: 0,
      preguntas: [],
      historial: [],
      seleccionActual: null
    };

    dom.final.style.display = "none";
    dom.juegoWrap.style.display = "block";

    generarPreguntas();

    if (!estado.preguntas.length) {
      dom.oracion.textContent = "No se pudieron generar preguntas con estos verbos 😢";
      dom.opciones.innerHTML = "";
      dom.btnSiguiente.style.display = "none";
      return;
    }

    mostrarPregunta();
  }

  /* -------- utilidades -------- */
  function barajar(array) {
    const copia = array.slice();
    for (let i = copia.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = copia[i];
      copia[i] = copia[j];
      copia[j] = temp;
    }
    return copia;
  }

  function filaAleatoria() {
    return 1 + Math.floor(Math.random() * (estado.verbos.length - 1));
  }

  /* -------- generación: mismo verbo, sus 3 formas -------- */
  function generarPreguntaMismoVerbo(plantilla) {
    for (let intento = 0; intento < 30; intento++) {
      const fila = filaAleatoria();
      const formas = [0, 1, 2].map(c => estado.verbos[fila][c]);
      const unicas = Array.from(new Set(formas));
      if (unicas.length >= 2) {
        return {
          plantilla,
          fila,
          opciones: barajar(unicas),
          respuestaCorrecta: estado.verbos[fila][plantilla.col]
        };
      }
    }
    return null;
  }

  /* -------- generación: verbo correcto fijo (del csv) + distractores curados --------
     A diferencia de "mismo_verbo", aquí el verbo correcto NO se elige al azar:
     viene definido en la plantilla para asegurar que la frase siempre tenga
     sentido con una única respuesta correcta. Los distractores también deben
     venir del csv — si no se encuentran en verbos.json, se descarta la
     pregunta en vez de rellenar con verbos al azar. */
  function buscarFilaPorInfinitivo(infinitivo) {
    return estado.verbos.findIndex(f => f[0] && f[0].toLowerCase() === infinitivo);
  }

  function generarPreguntaVerbosMezclados(plantilla) {
    if (!plantilla.verboCorrecto) return null;

    const filaCorrecta = buscarFilaPorInfinitivo(plantilla.verboCorrecto);
    if (filaCorrecta === -1) return null; // el verbo correcto no está en este verbos.json

    const respuestaCorrecta = estado.verbos[filaCorrecta][plantilla.col];
    const formasUsadas = new Set([respuestaCorrecta.toLowerCase()]);
    const distractores = [];

    plantilla.distractores.forEach(infinitivoBuscado => {
      const filaEncontrada = buscarFilaPorInfinitivo(infinitivoBuscado);
      if (filaEncontrada === -1) return; // ese distractor no está disponible, se omite
      const forma = estado.verbos[filaEncontrada][plantilla.col];
      if (!formasUsadas.has(forma.toLowerCase())) {
        formasUsadas.add(forma.toLowerCase());
        distractores.push(forma);
      }
    });

    if (!distractores.length) return null; // sin distractores válidos, se descarta la pregunta

    return {
      plantilla,
      fila: filaCorrecta,
      opciones: barajar([respuestaCorrecta, ...distractores]),
      respuestaCorrecta
    };
  }

  function generarPreguntas() {
    estado.preguntas = [];
    let intentosTotales = 0;
    const maxIntentos = estado.cantidad * 20;

    while (estado.preguntas.length < estado.cantidad && intentosTotales < maxIntentos) {
      intentosTotales++;
      const plantilla = plantillas[Math.floor(Math.random() * plantillas.length)];

      const pregunta =
        plantilla.tipo === "verbos_mezclados"
          ? generarPreguntaVerbosMezclados(plantilla)
          : generarPreguntaMismoVerbo(plantilla);

      if (pregunta) estado.preguntas.push(pregunta);
    }
  }

  /* -------- barra de progreso -------- */
  function actualizarProgreso() {
    dom.progreso.innerHTML = "";
    for (let i = 0; i < estado.preguntas.length; i++) {
      const dot = document.createElement("span");
      if (i < estado.indice) dot.classList.add("hecha");
      if (i === estado.indice) dot.classList.add("actual");
      dom.progreso.appendChild(dot);
    }
  }

  /* -------- mostrar pregunta (sin revelar nada aún) -------- */
  function mostrarPregunta() {
    actualizarProgreso();
    const p = estado.preguntas[estado.indice];
    estado.seleccionActual = null;

    dom.oracion.innerHTML = p.plantilla.texto.replace("___", '<span class="hueco"></span>');

    dom.opciones.innerHTML = "";
    p.opciones.forEach(valor => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "opcion-contexto";
      btn.textContent = valor;
      btn.addEventListener("click", () => elegirOpcion(valor, btn));
      dom.opciones.appendChild(btn);
    });

    dom.btnSiguiente.disabled = true;
    dom.btnSiguiente.innerHTML =
      estado.indice === estado.preguntas.length - 1
        ? "Ver resultados" + window.icono("flag")
        : "Siguiente pregunta" + window.icono("arrow_right");
  }

  /* -------- elegir una opción: solo marca selección, no revela nada -------- */
  function elegirOpcion(valor, botonElegido) {
    estado.seleccionActual = valor;

    Array.from(dom.opciones.children).forEach(btn => {
      btn.classList.toggle("seleccionada", btn === botonElegido);
    });

    dom.btnSiguiente.disabled = false;
  }

  function siguiente() {
    if (estado.seleccionActual === null) return;

    const p = estado.preguntas[estado.indice];
    const acierto = estado.seleccionActual === p.respuestaCorrecta;
    if (acierto) estado.puntaje++;

    estado.historial.push({
      textoPregunta: p.plantilla.texto.replace("___", `[${p.respuestaCorrecta}]`),
      tuRespuesta: estado.seleccionActual,
      respuestaCorrecta: p.respuestaCorrecta,
      pista: p.plantilla.pista,
      acierto
    });

    estado.indice++;
    if (estado.indice < estado.preguntas.length) {
      mostrarPregunta();
    } else {
      terminar();
    }
  }

  /* -------- fin de la partida -------- */
  function terminar() {
    dom.juegoWrap.style.display = "none";
    dom.final.style.display = "block";

    const total = estado.preguntas.length;
    dom.finalMensaje.textContent =
      estado.puntaje === total
        ? `¡Perfecto! ${estado.puntaje} de ${total} 🏆`
        : `Obtuviste ${estado.puntaje} de ${total} correctas`;

    renderizarResumen();
  }

  function renderizarResumen() {
    dom.listaCorrectas.innerHTML = "";
    dom.listaIncorrectas.innerHTML = "";

    estado.historial.forEach(item => {
      const li = document.createElement("li");
      const pistaHtml = item.pista
        ? `<span class="pista-texto">💡 ${item.pista}</span>`
        : "";

      if (item.acierto) {
        li.className = "item-resumen ok";
        li.innerHTML = `<span class="pregunta-texto">${item.textoPregunta}</span><span class="detalle-respuesta">Elegiste: ${item.tuRespuesta}</span>${pistaHtml}`;
        dom.listaCorrectas.appendChild(li);
      } else {
        li.className = "item-resumen mal";
        li.innerHTML = `<span class="pregunta-texto">${item.textoPregunta}</span><span class="detalle-respuesta">Elegiste: ${item.tuRespuesta} · Correcta: ${item.respuestaCorrecta}</span>${pistaHtml}`;
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

  /* -------- eventos internos del módulo -------- */
  dom.btnSiguiente.addEventListener("click", siguiente);
  dom.btnReintentar.addEventListener("click", () => iniciar(opcionesGuardadas));
  dom.btnMenu.addEventListener("click", () => {
    document.dispatchEvent(new CustomEvent("contextoVolverAlMenu"));
  });

  /* -------- única puerta de entrada pública -------- */
  window.IniciarContexto = iniciar;
})();