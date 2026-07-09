/* ============================================================
   MODO ARCADE — módulo aislado.
   No lee ni modifica el "estado" ni el "dom" de script.js.
   Se comunica hacia afuera solo con:
     - window.IniciarArcade(opciones)   ← llamada de entrada
     - evento "arcadeVolverAlMenu"      ← salida (volver al menú)
   ============================================================ */
(function () {
  "use strict";

  /* -------- configuración de dificultades -------- */
  const DIFICULTADES = {
    facil: {
      etiqueta: "Fácil",
      tiempoPorPalabra: 8000,
      paresColumnas: [[0, 1]],
      pasosParaGanar: 8,
      multiplicador: 1
    },
    medio: {
      etiqueta: "Medio",
      tiempoPorPalabra: 5500,
      paresColumnas: [[0, 1], [0, 2]],
      pasosParaGanar: 12,
      multiplicador: 1.5
    },
    dificil: {
      etiqueta: "Difícil",
      tiempoPorPalabra: 3500,
      paresColumnas: [[0, 1], [0, 2], [1, 2], [0, 3]],
      pasosParaGanar: 16,
      multiplicador: 2
    }
  };

  const PROB_BONUS = 0.18;
  const PUNTOS_BASE = 10;
  const PUNTOS_BONUS = 25;
  const PUNTOS_EXTRA_VIDA_LLENA = 40;

  /* -------- comparar respuestas, aceptando alternativas con "/" --------
     Ej: si el verbo dice "got/gotten", tanto "got" como "gotten" valen. */
  function respuestaCoincide(respuestaUsuario, respuestaEsperada) {
    const opciones = respuestaEsperada.split("/").map(op => op.trim().toLowerCase());
    return opciones.includes(respuestaUsuario.trim().toLowerCase());
  }

  /* -------- referencias al DOM propias del arcade -------- */
  const dom = {
    vidas: document.getElementById("arcadeVidas"),
    puntaje: document.getElementById("arcadePuntaje"),
    timerBarra: document.getElementById("arcadeTimerBarra"),
    personaje: document.getElementById("personajeArcade"),
    pregunta: document.getElementById("arcadePregunta"),
    respuesta: document.getElementById("arcadeRespuesta"),
    btnVerificar: document.getElementById("arcadeBtnVerificar"),
    resultado: document.getElementById("arcadeResultado"),
    juegoWrap: document.getElementById("arcadeJuegoWrap"),
    final: document.getElementById("arcadeFinal"),
    finalEmoji: document.getElementById("arcadeFinalEmoji"),
    finalMensaje: document.getElementById("arcadeFinalMensaje"),
    finalDetalle: document.getElementById("arcadeFinalDetalle"),
    btnReintentar: document.getElementById("arcadeBtnReintentar"),
    btnMenu: document.getElementById("arcadeBtnMenu")
  };

  let estado = null;
  let intervaloTimer = null;
  let opcionesGuardadas = null;

  /* -------- entrada pública -------- */
  function iniciar(opciones) {
    opcionesGuardadas = opciones;
    const preset = DIFICULTADES[opciones.dificultad] || DIFICULTADES.medio;

    estado = {
      verbos: opciones.verbos,
      preset,
      vidasMax: opciones.vidasMax,
      vidas: opciones.vidasMax,
      puntaje: 0,
      pasos: 0,
      preguntaActual: null,
      esPrimeraPregunta: true,
      terminado: false
    };

    dom.final.style.display = "none";
    dom.juegoWrap.style.display = "block";
    dom.personaje.style.left = "5%";
    dom.personaje.classList.remove("tropieza", "celebrando");
    dom.personaje.classList.add("corriendo");

    actualizarVidas();
    actualizarPuntaje();
    siguientePregunta();
  }

  /* -------- HUD -------- */
  function actualizarVidas() {
    dom.vidas.textContent = "❤️".repeat(estado.vidas) + "🤍".repeat(estado.vidasMax - estado.vidas);
  }

  function actualizarPuntaje() {
    dom.puntaje.textContent = estado.puntaje;
  }

  function moverPersonaje() {
    const porcentaje = 5 + (estado.pasos / estado.preset.pasosParaGanar) * 82;
    dom.personaje.style.left = `${Math.min(porcentaje, 87)}%`;
  }

  /* -------- generación de preguntas -------- */
  function elegirParDeColumnas() {
    const pares = estado.preset.paresColumnas;
    return pares[Math.floor(Math.random() * pares.length)];
  }

  function siguientePregunta() {
    if (estado.terminado) return;

    const esBonus = !estado.esPrimeraPregunta && Math.random() < PROB_BONUS;
    estado.esPrimeraPregunta = false;

    const fila = Math.floor(Math.random() * (estado.verbos.length - 1)) + 1;
    const [col1, col2] = elegirParDeColumnas();

    estado.preguntaActual = { fila, col1, col2, esBonus };

    const textoPregunta = `${estado.verbos[0][col1]}: ${estado.verbos[fila][col1]} → ${estado.verbos[0][col2]}: `;
    dom.pregunta.textContent = (esBonus ? "🌟 BONUS · " : "") + textoPregunta;
    dom.pregunta.classList.toggle("bonus", esBonus);

    dom.respuesta.value = "";
    dom.resultado.textContent = "";
    dom.resultado.className = "";
    dom.respuesta.focus();

    iniciarTemporizador();
  }

  /* -------- temporizador por palabra -------- */
  function iniciarTemporizador() {
    detenerTemporizador();
    const duracion = estado.preset.tiempoPorPalabra;
    const inicio = Date.now();

    dom.timerBarra.style.width = "100%";
    dom.timerBarra.classList.remove("urgente");

    intervaloTimer = setInterval(() => {
      const transcurrido = Date.now() - inicio;
      const restante = Math.max(0, duracion - transcurrido);
      const porcentaje = (restante / duracion) * 100;
      dom.timerBarra.style.width = `${porcentaje}%`;
      dom.timerBarra.classList.toggle("urgente", porcentaje < 30);

      if (restante <= 0) {
        detenerTemporizador();
        procesarRespuesta("");
      }
    }, 100);
  }

  function detenerTemporizador() {
    if (intervaloTimer) {
      clearInterval(intervaloTimer);
      intervaloTimer = null;
    }
  }

  /* -------- verificación de respuestas -------- */
  function verificar() {
    detenerTemporizador();
    procesarRespuesta(dom.respuesta.value);
  }

  function procesarRespuesta(valorRespuesta) {
    if (estado.terminado || !estado.preguntaActual) return;

    const { fila, col2, esBonus } = estado.preguntaActual;
    const acierto = valorRespuesta.trim() !== "" && respuestaCoincide(valorRespuesta, estado.verbos[fila][col2]);

    if (acierto) {
      const puntos = Math.round((esBonus ? PUNTOS_BONUS : PUNTOS_BASE) * estado.preset.multiplicador);
      estado.puntaje += puntos;
      estado.pasos++;
      moverPersonaje();

      if (esBonus) {
        if (estado.vidas < estado.vidasMax) {
          estado.vidas++;
          dom.resultado.textContent = `🌟 ¡Bonus! +${puntos} pts y +1 vida`;
        } else {
          estado.puntaje += PUNTOS_EXTRA_VIDA_LLENA;
          dom.resultado.textContent = `🌟 ¡Bonus! +${puntos + PUNTOS_EXTRA_VIDA_LLENA} pts (vidas al máximo)`;
        }
        dom.resultado.className = "bonus";
      } else {
        dom.resultado.textContent = `✅ ¡Correcto! +${puntos} pts`;
        dom.resultado.className = "correcto";
      }

      actualizarVidas();
      actualizarPuntaje();

      if (estado.pasos >= estado.preset.pasosParaGanar) {
        setTimeout(() => terminarJuego(true), 700);
        return;
      }
    } else {
      dom.personaje.classList.remove("corriendo");
      dom.personaje.classList.add("tropieza");
      setTimeout(() => {
        dom.personaje.classList.remove("tropieza");
        dom.personaje.classList.add("corriendo");
      }, 500);

      if (esBonus) {
        dom.resultado.textContent = "El bonus se escapó, ¡sin penalización!";
        dom.resultado.className = "bonus";
      } else {
        estado.vidas--;
        actualizarVidas();
        dom.resultado.textContent = valorRespuesta.trim() === ""
          ? `⏰ ¡Se acabó el tiempo! Era: ${estado.verbos[fila][col2]}`
          : `❌ Incorrecto. Era: ${estado.verbos[fila][col2]}`;
        dom.resultado.className = "incorrecto";

        if (estado.vidas <= 0) {
          setTimeout(() => terminarJuego(false), 900);
          return;
        }
      }
    }

    setTimeout(siguientePregunta, 1100);
  }

  /* -------- fin de la partida -------- */
  function terminarJuego(gano) {
    estado.terminado = true;
    detenerTemporizador();
    dom.juegoWrap.style.display = "none";
    dom.final.style.display = "block";

    if (gano) {
      dom.personaje.classList.remove("tropieza", "corriendo");
      dom.personaje.classList.add("celebrando");
      dom.finalEmoji.textContent = "🏆";
      dom.finalMensaje.textContent = "¡Llegaste a la meta!";
    } else {
      dom.personaje.classList.remove("corriendo", "celebrando");
      dom.finalEmoji.textContent = "💔";
      dom.finalMensaje.textContent = "Te quedaste sin vidas";
    }

    dom.finalDetalle.textContent = `Puntaje final: ${estado.puntaje} pts · Dificultad: ${estado.preset.etiqueta}`;
  }

  /* -------- eventos internos del módulo -------- */
  dom.btnVerificar.addEventListener("click", verificar);
  dom.respuesta.addEventListener("keydown", (e) => {
    if (e.key === "Enter") verificar();
  });

  dom.btnReintentar.addEventListener("click", () => iniciar(opcionesGuardadas));

  dom.btnMenu.addEventListener("click", () => {
    detenerTemporizador();
    document.dispatchEvent(new CustomEvent("arcadeVolverAlMenu"));
  });

  /* -------- única puerta de entrada pública -------- */
  window.IniciarArcade = iniciar;
})();