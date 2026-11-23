/* ==========================================================================
   residAR · Motor de Presentación Interactiva
   Defensa Oral de Tesis · UTN FRC · Comisión 5K1 · Grupo 3
   ========================================================================== */

(function () {
  "use strict";

  function $(sel, el) { return (el || document).querySelector(sel); }
  function $$(sel, el) { return Array.from((el || document).querySelectorAll(sel)); }

  var slides = $$(".slide");
  var totalSlides = slides.length;
  var currentSlide = 0;
  var currentStep = 0;

  /* ==========================================================
     00 · ESCALADO DEL LIENZO 1600x900 AL TAMAÑO DE PANTALLA
     ========================================================== */
  var STAGE_W = 1600;
  var STAGE_H = 900;
  var stageScale = 1;

  function fitStage() {
    stageScale = Math.min(window.innerWidth / STAGE_W, window.innerHeight / STAGE_H);
    document.documentElement.style.setProperty("--stage-scale", stageScale);
  }
  fitStage();

  var hudSectionLabel = $("#hudSectionLabel");
  var hudProgressFill = $("#hudProgressFill");
  var slideCounter = $("#slideCounter");

  /* ==========================================================
     01 · CANVAS DE PARTÍCULAS DUAL-COLOR (PORTADA)
     ========================================================== */
  var canvas = $("#logoCanvas");
  var heroLogoImg = $("#heroLogoImg");
  var ctx = canvas ? canvas.getContext("2d") : null;
  var particles = [];
  var animReq = null;
  var canvasConverged = false;
  var animStartTime = 0;
  var LOGO_ASPECT = 699.3 / 821.3;   // alto / ancho del viewBox de residar-logo.svg
  var CONVERGE_MS = 2200;
  var FADE_MS = 900;

  function initParticles() {
    if (!canvas || !window.RESIDAR_LOGO_POINTS) return;

    // offsetWidth/Height = tamaño lógico (sin el transform de escala del stage)
    var W = canvas.parentElement.offsetWidth;
    var H = canvas.parentElement.offsetHeight;
    var ratio = (window.devicePixelRatio || 1) * stageScale;
    canvas.width = Math.round(W * ratio);
    canvas.height = Math.round(H * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    var cx = W / 2;
    var cy = H / 2;

    // Las partículas se encajan exactamente en el recuadro del logo vectorial,
    // así al hacer el fundido coinciden en vez de quedar dos logos desfasados.
    var rawPoints = window.RESIDAR_LOGO_POINTS;
    var minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    rawPoints.forEach(function (pt) {
      if (pt[0] < minX) minX = pt[0];
      if (pt[0] > maxX) maxX = pt[0];
      if (pt[1] < minY) minY = pt[1];
      if (pt[1] > maxY) maxY = pt[1];
    });
    var logoW = (heroLogoImg && heroLogoImg.offsetWidth) || 190;
    var logoH = logoW * LOGO_ASPECT;
    var logoLeft = cx - logoW / 2;
    var logoTop = cy - logoH / 2;

    particles = rawPoints.map(function (pt) {
      var tx = logoLeft + (pt[0] - minX) / (maxX - minX) * logoW;
      var ty = logoTop + (pt[1] - minY) / (maxY - minY) * logoH;
      var sx = cx + (Math.random() - 0.5) * W * 1.8;
      var sy = cy + (Math.random() - 0.5) * H * 1.8;
      var speed = 0.02 + Math.random() * 0.025;
      var colorType = pt[2] || 0;

      return {
        x: sx,
        y: sy,
        tx: tx,
        ty: ty,
        colorType: colorType,
        size: 1.8 + Math.random() * 1.4,
        alpha: 0.1 + Math.random() * 0.5,
        speed: speed
      };
    });

    animStartTime = performance.now();
    canvasConverged = false;
    if (heroLogoImg) heroLogoImg.classList.remove("visible");

    if (animReq) cancelAnimationFrame(animReq);
    loopParticles();
  }

  function loopParticles() {
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.parentElement.offsetWidth, canvas.parentElement.offsetHeight);

    var elapsed = performance.now() - animStartTime;
    var convergeFactor = Math.min(1, elapsed / CONVERGE_MS);
    var ease = 1 - Math.pow(1 - convergeFactor, 3);
    if (convergeFactor >= 0.9 && !canvasConverged) {
      canvasConverged = true;
      if (heroLogoImg) heroLogoImg.classList.add("visible");
    }

    // Una vez armado el logo, las partículas se desvanecen y queda sólo el SVG nítido
    var fade = elapsed > CONVERGE_MS ? Math.max(0, 1 - (elapsed - CONVERGE_MS) / FADE_MS) : 1;
    if (fade <= 0) {
      animReq = null;
      return;
    }
    ctx.globalAlpha = fade;

    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      var curX = p.x + (p.tx - p.x) * ease;
      var curY = p.y + (p.ty - p.y) * ease;

      ctx.beginPath();
      ctx.arc(curX, curY, p.size, 0, Math.PI * 2);

      if (p.colorType === 1) {
        ctx.fillStyle = "rgba(180, 55, 46, " + (0.4 + ease * 0.55) + ")";
      } else {
        ctx.fillStyle = "rgba(12, 53, 100, " + (0.35 + ease * 0.5) + ")";
      }
      ctx.fill();
    }

    animReq = requestAnimationFrame(loopParticles);
  }

  function stopParticles() {
    if (animReq) cancelAnimationFrame(animReq);
    animReq = null;
  }

  /* ==========================================================
     02 · CRONÓMETRO DEMO EN VIVO (SLIDE 06)
     ========================================================== */
  var DEMO_TOTAL_SECS = 11 * 60;
  var demoRemainingMs = DEMO_TOTAL_SECS * 1000; // tiempo restante al último pause
  var demoStartedAt = 0;                         // timestamp del último start
  var demoTimerRunning = false;
  var demoInterval = null;
  var demoClockEl = $("#demoClock");
  var btnToggleTimer = $("#btnToggleTimer");
  var btnResetTimer = $("#btnResetTimer");

  function demoRemainingSecs() {
    var ms = demoRemainingMs - (demoTimerRunning ? performance.now() - demoStartedAt : 0);
    return Math.ceil(ms / 1000);
  }

  function updateDemoClockDisplay() {
    if (!demoClockEl) return;
    var secs = demoRemainingSecs();
    var abs = Math.abs(secs);
    var m = Math.floor(abs / 60);
    var s = abs % 60;
    // Al pasarse del tiempo sigue contando en negativo (+MM:SS) para saber cuánto nos excedimos
    demoClockEl.textContent = (secs < 0 ? "+" : "") + (m < 10 ? "0" : "") + m + ":" + (s < 10 ? "0" : "") + s;

    if (secs <= 0) {
      demoClockEl.style.color = "#f87171";
    } else if (secs <= 120) {
      demoClockEl.style.color = "#fbbf24";
    } else {
      demoClockEl.style.color = "#ffffff";
    }
    if (btnToggleTimer && demoTimerRunning) {
      btnToggleTimer.textContent = secs <= 0 ? "Tiempo excedido · Pausar (D)" : "Pausar Demo (D)";
    }
  }

  function toggleDemoTimer() {
    if (demoTimerRunning) {
      demoRemainingMs -= performance.now() - demoStartedAt;
      demoTimerRunning = false;
      clearInterval(demoInterval);
      if (btnToggleTimer) btnToggleTimer.textContent = "Continuar Demo (D)";
    } else {
      demoStartedAt = performance.now();
      demoTimerRunning = true;
      demoInterval = setInterval(updateDemoClockDisplay, 250);
    }
    updateDemoClockDisplay();
  }

  function resetDemoTimer() {
    clearInterval(demoInterval);
    demoTimerRunning = false;
    demoRemainingMs = DEMO_TOTAL_SECS * 1000;
    updateDemoClockDisplay();
    if (btnToggleTimer) btnToggleTimer.textContent = "Iniciar Demo (D)";
  }

  if (btnToggleTimer) btnToggleTimer.addEventListener("click", toggleDemoTimer);
  if (btnResetTimer) btnResetTimer.addEventListener("click", resetDemoTimer);

  $$(".demo-check-item").forEach(function (item) {
    item.addEventListener("click", function () {
      item.classList.toggle("done");
    });
  });

  /* ==========================================================
     03 · SPOTLIGHT TABLET DE GUARDIA (SLIDE 07)
     ========================================================== */
  var tabletSpot = $("#tabletSpot");
  var focusCards = $$(".focus-card");
  var spotCoords = {
    signos: { left: "15%", top: "25%", width: "42%", height: "60%" },
    alertas: { left: "58%", top: "20%", width: "38%", height: "35%" },
    foto: { left: "12%", top: "10%", width: "32%", height: "22%" },
    guardia: { left: "58%", top: "60%", width: "38%", height: "32%" }
  };

  function applyTabletSpot(spotKey) {
    var coords = spotCoords[spotKey] || spotCoords.signos;
    if (tabletSpot) {
      tabletSpot.style.left = coords.left;
      tabletSpot.style.top = coords.top;
      tabletSpot.style.width = coords.width;
      tabletSpot.style.height = coords.height;
    }
    focusCards.forEach(function (card) {
      card.classList.toggle("active", card.dataset.spot === spotKey);
    });
  }

  focusCards.forEach(function (card) {
    card.addEventListener("click", function () {
      applyTabletSpot(card.dataset.spot);
    });
  });

  /* ==========================================================
     04 · COCKPIT INTERACTIVO DE ADRS (SLIDE 09)
     ========================================================== */
  var ADR_DATA = {
    "1": {
      badge: "ADR-001 · Multi-Tenancy",
      scope: "Ámbito: Persistencia & Tenants",
      title: "Multitenancy con Base de Datos Compartida y Residencia como Tenant Operativo",
      contexto: "¿Cómo soportar múltiples organizaciones y residencias garantizando aislamiento operativo sin disparar costos de infraestructura?",
      decision: "Base de datos PostgreSQL única compartida. residencia_id es el tenant operativo obligatorio en cada consulta; organizacion_id es el agrupador superior empresarial.",
      tradeoff: "Descartado: BD por tenant (costo prohibitivo y migraciones lentas). Trade-off: Requiere disciplina estricta en backend: cada query operativa exige residencia_id.",
      consecuencia: "Escalabilidad económica para residencias argentinas, mantenimiento simplificado de migraciones Prisma y aislamiento lógico estricto mediante guards.",
      svg: '<svg viewBox="0 0 460 260" xmlns="http://www.w3.org/2000/svg"><rect width="460" height="260" rx="10" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1.5"/><g transform="translate(20,20)"><rect width="120" height="40" rx="6" fill="#0c3564"/><text x="60" y="24" fill="#ffffff" font-size="11" font-weight="bold" text-anchor="middle" font-family="Montserrat">HTTP Request</text><text x="60" y="34" fill="#93c5fd" font-size="8" text-anchor="middle" font-family="Consolas">residencia_id: 1</text></g><path d="M 140 40 L 190 40" stroke="#b4372e" stroke-width="2.5" stroke-dasharray="4,3"/><polygon points="190,36 198,40 190,44" fill="#b4372e"/><g transform="translate(200,15)"><rect width="120" height="50" rx="6" fill="#ffffff" stroke="#b4372e" stroke-width="2"/><text x="60" y="22" fill="#0c3564" font-size="10" font-weight="bold" text-anchor="middle" font-family="Montserrat">Tenant Interceptor</text><text x="60" y="38" fill="#059669" font-size="9" font-weight="bold" text-anchor="middle" font-family="Consolas">WHERE res_id = 1</text></g><path d="M 320 40 L 370 40" stroke="#0c3564" stroke-width="2"/><polygon points="370,36 378,40 370,44" fill="#0c3564"/><g transform="translate(200,95)"><rect width="240" height="145" rx="8" fill="#ffffff" stroke="#0c3564" stroke-width="2"/><rect width="240" height="28" rx="8" fill="#0c3564"/><text x="120" y="18" fill="#ffffff" font-size="11" font-weight="bold" text-anchor="middle" font-family="Montserrat">PostgreSQL · Base Compartida</text><g transform="translate(15,38)"><rect width="210" height="24" rx="4" fill="#fee2e2" stroke="#b4372e" stroke-width="1.5"/><text x="10" y="16" fill="#991b1b" font-size="9" font-weight="bold" font-family="Consolas">residencia_id = 1 (Espinosa) [ACTIVO]</text></g><g transform="translate(15,68)"><rect width="210" height="20" rx="4" fill="#f1f5f9"/><text x="10" y="14" fill="#64748b" font-size="9" font-family="Consolas">residencia_id = 2 (Centro) [AISLADO]</text></g><g transform="translate(15,93)"><rect width="210" height="20" rx="4" fill="#f1f5f9"/><text x="10" y="14" fill="#64748b" font-size="9" font-family="Consolas">residencia_id = 3 (Nva Cba) [AISLADO]</text></g><g transform="translate(15,118)"><rect width="210" height="20" rx="4" fill="#f1f5f9"/><text x="10" y="14" fill="#64748b" font-size="9" font-family="Consolas">residencia_id = 4 (Sede Norte) [AISLADO]</text></g></g><g transform="translate(20,130)"><rect width="160" height="85" rx="6" fill="#ecfdf5" stroke="#10b981" stroke-width="1.5"/><text x="80" y="24" fill="#065f46" font-size="11" font-weight="bold" text-anchor="middle" font-family="Montserrat">Garantía de Aislamiento</text><text x="80" y="44" fill="#047857" font-size="9" text-anchor="middle" font-family="Montserrat">Aislamiento por residencia_id</text><text x="80" y="60" fill="#047857" font-size="9" text-anchor="middle" font-family="Montserrat">1 sola BD · costo contenido</text><text x="80" y="74" fill="#059669" font-size="8" font-weight="bold" text-anchor="middle" font-family="Consolas">Filtro obligatorio en guards</text></g></svg>'
    },
    "7": {
      badge: "ADR-007 · Subdominios & Stock",
      scope: "Ámbito: Networking & Modelo de Stock",
      title: "Contexto por Subdominio y Modelo de Stock Normalizado",
      contexto: "Identificación institucional por URL y gestión de fármacos provistos por familias frente a insumos generales de la residencia.",
      decision: "Frontera de confianza por host (ej: espinosa.residar.com). En stock, modelo normalizado: Stock Central (residencia) vs Stock Individual (residente) con lotes y vencimiento.",
      tradeoff: "Descartado: Botiquín único mezclado. Trade-off: Exige validar siempre si el fármaco administrado consume del residente o del stock institucional.",
      consecuencia: "Trazabilidad completa de recepciones con firma/foto y consumo directo al registrar cada administración clínica de medicación.",
      svg: '<svg viewBox="0 0 460 260" xmlns="http://www.w3.org/2000/svg"><rect width="460" height="260" rx="10" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1.5"/><g transform="translate(15,20)"><rect width="180" height="50" rx="6" fill="#0c3564"/><text x="90" y="24" fill="#ffffff" font-size="11" font-weight="bold" text-anchor="middle" font-family="Montserrat">espinosa.residar.com</text><text x="90" y="40" fill="#93c5fd" font-size="9" text-anchor="middle" font-family="Consolas">Frontera de Confianza Host</text></g><path d="M 195 45 L 245 45" stroke="#0c3564" stroke-width="2"/><polygon points="245,41 253,45 245,49" fill="#0c3564"/><g transform="translate(255,20)"><rect width="190" height="50" rx="6" fill="#ffffff" stroke="#0c3564" stroke-width="1.5"/><text x="95" y="24" fill="#0c3564" font-size="10" font-weight="bold" text-anchor="middle" font-family="Montserrat">Contexto Organizacional</text><text x="95" y="40" fill="#b4372e" font-size="9" font-weight="bold" text-anchor="middle" font-family="Consolas">organizacion_id Resuelta</text></g><g transform="translate(15,95)"><rect width="205" height="145" rx="8" fill="#ffffff" stroke="#0c3564" stroke-width="2"/><rect width="205" height="26" rx="8" fill="#0c3564"/><text x="102" y="17" fill="#ffffff" font-size="10" font-weight="bold" text-anchor="middle" font-family="Montserrat">STOCK CENTRAL (Residencia)</text><text x="102" y="50" fill="#334155" font-size="9" font-weight="bold" text-anchor="middle">propietario_tipo = RESIDENCIA</text><text x="102" y="68" fill="#64748b" font-size="9" text-anchor="middle">residente_id = NULL</text><g transform="translate(15,82)"><rect width="175" height="48" rx="4" fill="#f1f5f9"/><text x="10" y="18" fill="#0c3564" font-size="9" font-weight="bold">• Sueros fisiológicos</text><text x="10" y="32" fill="#0c3564" font-size="9" font-weight="bold">• Gasas y apósitos</text><text x="10" y="44" fill="#059669" font-size="8" font-family="Consolas">Recepción institucional</text></g></g><g transform="translate(235,95)"><rect width="210" height="145" rx="8" fill="#ffffff" stroke="#b4372e" stroke-width="2"/><rect width="210" height="26" rx="8" fill="#b4372e"/><text x="105" y="17" fill="#ffffff" font-size="10" font-weight="bold" text-anchor="middle" font-family="Montserrat">STOCK INDIVIDUAL (Residente)</text><text x="105" y="50" fill="#991b1b" font-size="9" font-weight="bold" text-anchor="middle">propietario_tipo = RESIDENTE</text><text x="105" y="68" fill="#b4372e" font-size="9" font-weight="bold" text-anchor="middle">residente_id = 42 (M. Belgrano)</text><g transform="translate(15,82)"><rect width="180" height="48" rx="4" fill="#fef2f2" stroke="#fca5a5" stroke-width="1"/><text x="10" y="16" fill="#991b1b" font-size="9" font-weight="bold">• Enalapril 10mg (Lote #B12)</text><text x="10" y="30" fill="#059669" font-size="8" font-weight="bold">✓ Firma digital familiar</text><text x="10" y="42" fill="#2563eb" font-size="8" font-weight="bold">📷 Foto comprobante en R2</text></g></g></svg>'
    },
    "8": {
      badge: "ADR-008 · Residencia Activa",
      scope: "Ámbito: Seguridad & Sesiones JWT",
      title: "Residencia Activa Única y Rol Efectivo Dinámico",
      contexto: "Médicos y enfermeros que trabajan en múltiples sedes de una organización necesitan operar sin duplicar cuentas de usuario.",
      decision: "Una única residencia activa por sesión JWT. El usuario selecciona la sede al ingresar o rotar; el backend recalcula inmediatamente su rol y permisos efectivos.",
      tradeoff: "Descartado: Permisos globales multisede simultáneos (alto riesgo de cargar un registro clínico en la sede equivocada).",
      consecuencia: "Experiencia sin fricción para el personal de salud itinerante y frontera de permisos estrictamente controlada por sesión.",
      svg: '<svg viewBox="0 0 460 260" xmlns="http://www.w3.org/2000/svg"><rect width="460" height="260" rx="10" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1.5"/><g transform="translate(20,25)"><circle cx="35" cy="35" r="28" fill="#0c3564"/><text x="35" y="40" fill="#ffffff" font-size="18" text-anchor="middle">👨‍⚕️</text><text x="80" y="28" fill="#0c3564" font-size="12" font-weight="bold" font-family="Montserrat">Usuario Único</text><text x="80" y="44" fill="#64748b" font-size="9" font-family="Consolas">gonzalo.med@residar.com</text></g><path d="M 230 45 L 275 45" stroke="#0c3564" stroke-width="2"/><polygon points="275,41 283,45 275,49" fill="#0c3564"/><g transform="translate(285,15)"><rect width="155" height="60" rx="6" fill="#ffffff" stroke="#b4372e" stroke-width="2"/><text x="77" y="22" fill="#b4372e" font-size="10" font-weight="bold" text-anchor="middle" font-family="Montserrat">Selector de Sede Activa</text><rect x="15" y="32" width="125" height="20" rx="4" fill="#fee2e2"/><text x="77" y="46" fill="#991b1b" font-size="9" font-weight="bold" text-anchor="middle" font-family="Montserrat">Sede Espinosa ▾</text></g><path d="M 360 85 L 360 120" stroke="#b4372e" stroke-width="2.5" stroke-dasharray="4,3"/><polygon points="356,120 360,128 364,120" fill="#b4372e"/><g transform="translate(20,135)"><rect width="420" height="105" rx="8" fill="#ffffff" stroke="#0c3564" stroke-width="2"/><rect width="420" height="26" rx="8" fill="#0c3564"/><text x="210" y="17" fill="#ffffff" font-size="11" font-weight="bold" text-anchor="middle" font-family="Montserrat">Token JWT Recalculado en Memoria (ADR-012)</text><g transform="translate(20,38)"><rect width="180" height="54" rx="4" fill="#ecfdf5" stroke="#10b981" stroke-width="1"/><text x="10" y="18" fill="#065f46" font-size="9" font-weight="bold">Sede A (Espinosa):</text><text x="10" y="32" fill="#047857" font-size="9">Rol: Médico Director</text><text x="10" y="46" fill="#059669" font-size="8" font-family="Consolas">permisos: { historia_clinica: ALL }</text></g><g transform="translate(220,38)"><rect width="180" height="54" rx="4" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1"/><text x="10" y="18" fill="#64748b" font-size="9" font-weight="bold">Sede B (Centro):</text><text x="10" y="32" fill="#64748b" font-size="9">Rol: Médico Guardia</text><text x="10" y="46" fill="#64748b" font-size="8" font-family="Consolas">permisos: { control_diario: ALTA }</text></g></g></svg>'
    },
    "9": {
      badge: "ADR-009 · Storage Cloud R2",
      scope: "Ámbito: Storage de Objetos & Privacidad",
      title: "Almacenamiento de Objetos en Cloudflare R2 con URLs Firmadas",
      contexto: "Custodia segura de contratos de ingreso firmados, recetas médicas y fotos sin saturar la base relacional ni exponer archivos públicamente.",
      decision: "Abstracción StorageProvider con adaptador R2StorageService compatible con S3. Buckets 100% privados; acceso mediante URLs prefirmadas temporales de 15 minutos.",
      tradeoff: "Descartado: Almacenar binarios en PostgreSQL (blobs) o buckets públicos con links estáticos (inadmisible por Ley 25.326).",
      consecuencia: "Protección de la privacidad alineada con la Ley 25.326 y sin costo de egreso de datos (Cloudflare R2 no cobra tráfico de salida).",
      svg: '<svg viewBox="0 0 460 260" xmlns="http://www.w3.org/2000/svg"><rect width="460" height="260" rx="10" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1.5"/><g transform="translate(20,25)"><rect width="110" height="60" rx="6" fill="#0c3564"/><text x="55" y="26" fill="#ffffff" font-size="11" font-weight="bold" text-anchor="middle" font-family="Montserrat">Browser</text><text x="55" y="42" fill="#ffffff" font-size="10" text-anchor="middle">Cliente Web</text></g><path d="M 135 45 L 210 45" stroke="#0c3564" stroke-width="2"/><polygon points="210,41 218,45 210,49" fill="#0c3564"/><text x="175" y="38" fill="#64748b" font-size="8" font-weight="bold" text-anchor="middle">1. Pedir URL</text><g transform="translate(225,20)"><rect width="140" height="70" rx="6" fill="#ffffff" stroke="#b4372e" stroke-width="2"/><text x="70" y="24" fill="#0c3564" font-size="11" font-weight="bold" text-anchor="middle" font-family="Montserrat">Backend NestJS</text><text x="70" y="40" fill="#b4372e" font-size="9" font-weight="bold" text-anchor="middle" font-family="Consolas">StorageProvider</text><text x="70" y="56" fill="#059669" font-size="8" font-weight="bold" text-anchor="middle">Firma S3 AWS-SDK</text></g><path d="M 220 70 L 140 70" stroke="#059669" stroke-width="2" stroke-dasharray="3,3"/><polygon points="140,74 132,70 140,66" fill="#059669"/><text x="175" y="85" fill="#059669" font-size="8" font-weight="bold" text-anchor="middle">2. Presigned URL (15m)</text><g transform="translate(225,140)"><rect width="215" height="95" rx="8" fill="#f0f9ff" stroke="#0284c7" stroke-width="2"/><rect width="215" height="24" rx="8" fill="#0284c7"/><text x="107" y="16" fill="#ffffff" font-size="10" font-weight="bold" text-anchor="middle" font-family="Montserrat">Cloudflare R2 (Private Bucket)</text><g transform="translate(15,34)"><text x="0" y="14" fill="#0369a1" font-size="9" font-weight="bold">🔒 Bucket privado, sin links públicos</text><text x="0" y="28" fill="#0369a1" font-size="9" font-weight="bold">🛡️ Alineado con Ley 25.326</text><text x="0" y="42" fill="#0284c7" font-size="9" font-weight="bold">⚡ Sin costo de egreso</text></g></g><path d="M 80 90 L 80 185 L 215 185" fill="none" stroke="#b4372e" stroke-width="2.5"/><polygon points="215,181 223,185 215,189" fill="#b4372e"/><text x="135" y="175" fill="#b4372e" font-size="9" font-weight="bold" text-anchor="middle">3. Upload/Download Directo</text></svg>'
    },
    "2": {
      badge: "ADR-002 · Stack Tecnológico",
      scope: "Ámbito: Frontend & Backend Core",
      title: "Stack Next.js 14 + NestJS 10 + TypeScript de Punta a Punta",
      contexto: "Selección de tecnologías para soportar interfaz asistencial rápida y backend de alta integridad.",
      decision: "Next.js con App Router y BFF proxy para el cliente; NestJS modular con TypeScript estricto en backend.",
      tradeoff: "Descartado: SPA monolítica sin BFF. Ganancia: Separación de dominios y proxy same-origin.",
      consecuencia: "Tipado de punta a punta, separación clara entre presentación y dominio clínico, y alta productividad del equipo.",
      svg: '<svg viewBox="0 0 460 260" xmlns="http://www.w3.org/2000/svg"><rect width="460" height="260" rx="10" fill="#f8fafc" stroke="#e2e8f0"/><g transform="translate(30,40)"><rect width="180" height="170" rx="8" fill="#ffffff" stroke="#0c3564" stroke-width="2"/><text x="90" y="30" fill="#0c3564" font-size="12" font-weight="bold" text-anchor="middle">Next.js 14</text><text x="90" y="60" fill="#64748b" font-size="10" text-anchor="middle">• React 18 + Tailwind</text><text x="90" y="85" fill="#64748b" font-size="10" text-anchor="middle">• App Router SPA</text><text x="90" y="110" fill="#64748b" font-size="10" text-anchor="middle">• BFF Proxy Same-Origin</text><text x="90" y="135" fill="#64748b" font-size="10" text-anchor="middle">• Memory Token Access</text></g><path d="M 215 125 L 245 125" stroke="#b4372e" stroke-width="2"/><g transform="translate(250,40)"><rect width="180" height="170" rx="8" fill="#ffffff" stroke="#b4372e" stroke-width="2"/><text x="90" y="30" fill="#b4372e" font-size="12" font-weight="bold" text-anchor="middle">NestJS 10</text><text x="90" y="60" fill="#64748b" font-size="10" text-anchor="middle">• TypeScript Estricto</text><text x="90" y="85" fill="#64748b" font-size="10" text-anchor="middle">• Prisma ORM tipado</text><text x="90" y="110" fill="#64748b" font-size="10" text-anchor="middle">• DTOs class-validator</text><text x="90" y="135" fill="#64748b" font-size="10" text-anchor="middle">• Pipeline de Guards RBAC</text></g></svg>'
    },
    "5": {
      badge: "ADR-005 · Fechas ISO 8601",
      scope: "Ámbito: Manejo Temporal Clínico",
      title: "Formato Canónico de Fechas en Strings ISO 8601 UTC",
      contexto: "Problemas de sincronización de husos horarios entre PostgreSQL, servidor y navegadores cliente.",
      decision: "Almacenar y transportar todas las marcas temporales como strings ISO 8601 UTC inmutables.",
      tradeoff: "Descartado: Timestamps numéricos o Date objects locales dependientes del cliente.",
      consecuencia: "Evita discrepancias de huso horario en las tomas de medicación y en los registros de turno de enfermería.",
      svg: '<svg viewBox="0 0 460 260" xmlns="http://www.w3.org/2000/svg"><rect width="460" height="260" rx="10" fill="#f8fafc" stroke="#e2e8f0"/><g transform="translate(40,50)"><rect width="380" height="150" rx="8" fill="#ffffff" stroke="#0c3564" stroke-width="2"/><text x="190" y="35" fill="#0c3564" font-size="12" font-weight="bold" text-anchor="middle">Estándar Temporal Canónico</text><rect x="30" y="60" width="320" height="35" rx="6" fill="#f1f5f9"/><text x="190" y="82" fill="#b4372e" font-size="13" font-family="Consolas" font-weight="bold" text-anchor="middle">2026-11-23T08:00:00.000Z</text><text x="190" y="125" fill="#059669" font-size="10" font-weight="bold" text-anchor="middle">✓ Trazabilidad exacta en tomas de guardia y signos vitales</text></g></svg>'
    },
    "6": {
      badge: "ADR-006 · Permisos JSONB",
      scope: "Ámbito: Seguridad & Autorización RBAC",
      title: "Permisos por Rol en JSONB Jerárquico (ABMC)",
      contexto: "Control de acceso granular por área funcional sin sobrecargar tablas relacionales de permisos.",
      decision: "Columna permisos en formato JSONB con jerarquía: consulta → alta → modificacion → borrado, y soporte de bypass all: true.",
      tradeoff: "Descartado: Tablas relacionales n-a-n (muy lentas en cada request) o roles planos sin granularidad.",
      consecuencia: "Extrema flexibilidad para crear nuevos roles operativos en cada residencia y validación ultrarrápida en memoria.",
      svg: '<svg viewBox="0 0 460 260" xmlns="http://www.w3.org/2000/svg"><rect width="460" height="260" rx="10" fill="#f8fafc" stroke="#e2e8f0"/><g transform="translate(30,40)"><rect width="400" height="175" rx="8" fill="#ffffff" stroke="#0c3564" stroke-width="2"/><text x="200" y="30" fill="#0c3564" font-size="11" font-weight="bold" text-anchor="middle">Jerarquía de Acciones ABMC en Memoria</text><g transform="translate(25,50)"><rect width="75" height="35" rx="4" fill="#dbeafe"/><text x="37" y="22" fill="#1e40af" font-size="9" font-weight="bold" text-anchor="middle">consulta</text></g><text x="110" y="72" fill="#64748b" font-size="14">→</text><g transform="translate(125,50)"><rect width="75" height="35" rx="4" fill="#dcfce7"/><text x="37" y="22" fill="#166534" font-size="9" font-weight="bold" text-anchor="middle">alta</text></g><text x="210" y="72" fill="#64748b" font-size="14">→</text><g transform="translate(225,50)"><rect width="75" height="35" rx="4" fill="#fef3c7"/><text x="37" y="22" fill="#92400e" font-size="9" font-weight="bold" text-anchor="middle">modificación</text></g><text x="310" y="72" fill="#64748b" font-size="14">→</text><g transform="translate(325,50)"><rect width="60" height="35" rx="4" fill="#fee2e2"/><text x="30" y="22" fill="#991b1b" font-size="9" font-weight="bold" text-anchor="middle">borrado</text></g><g transform="translate(25,105)"><rect width="350" height="45" rx="4" fill="#f8fafc" stroke="#e2e8f0"/><text x="15" y="20" fill="#0c3564" font-size="9" font-family="Consolas" font-weight="bold">permisos: { historia_clinica: "modificacion" }</text><text x="15" y="36" fill="#059669" font-size="8">Implica automáticamente permisos de alta y consulta</text></g></g></svg>'
    },
    "10": {
      badge: "ADR-010 · Tratamientos",
      scope: "Ámbito: Cuidados Clínicos",
      title: "Creación y Planificación de Tratamientos Programables",
      contexto: "Modelado de prescripciones médicas con frecuencias horarias variables (ej: cada 8 hs, tomas con comidas).",
      decision: "Generación automática de tomas proyectadas que el enfermero valida al momento exacto de la administración.",
      tradeoff: "Descartado: Registro retroactivo en papel sin alertas tempranas de omisión.",
      consecuencia: "Reduce el riesgo de omitir una dosis: el panel de guardia muestra las tomas pendientes o retrasadas.",
      svg: '<svg viewBox="0 0 460 260" xmlns="http://www.w3.org/2000/svg"><rect width="460" height="260" rx="10" fill="#f8fafc" stroke="#e2e8f0"/><g transform="translate(40,40)"><rect width="380" height="170" rx="8" fill="#ffffff" stroke="#0c3564" stroke-width="2"/><text x="190" y="30" fill="#0c3564" font-size="12" font-weight="bold" text-anchor="middle">Proyección Automática de Tomas Horarias</text><g transform="translate(30,55)"><rect width="90" height="45" rx="4" fill="#fee2e2"/><text x="45" y="22" fill="#991b1b" font-size="9" font-weight="bold" text-anchor="middle">08:00 hs</text><text x="45" y="36" fill="#991b1b" font-size="8" text-anchor="middle">Enalapril</text></g><g transform="translate(145,55)"><rect width="90" height="45" rx="4" fill="#ecfdf5"/><text x="45" y="22" fill="#065f46" font-size="9" font-weight="bold" text-anchor="middle">13:00 hs</text><text x="45" y="36" fill="#065f46" font-size="8" text-anchor="middle">Metformina</text></g><g transform="translate(260,55)"><rect width="90" height="45" rx="4" fill="#fef3c7"/><text x="45" y="22" fill="#92400e" font-size="9" font-weight="bold" text-anchor="middle">21:00 hs</text><text x="45" y="36" fill="#92400e" font-size="8" text-anchor="middle">Clonazepam</text></g><text x="190" y="135" fill="#0c3564" font-size="10" font-weight="bold" text-anchor="middle">Descuento automático de 1 unidad al confirmar administración</text></g></svg>'
    },
    "11": {
      badge: "ADR-011 · Errores RFC 7807",
      scope: "Ámbito: API & Resiliencia",
      title: "Formato de Errores Centralizado (AppError)",
      contexto: "Respuestas heterogéneas de error que filtraban información interna y dificultaban el manejo en frontend.",
      decision: "Filtro global de excepciones con clase AppError, código semántico y mensaje sanitizado al cliente.",
      tradeoff: "Descartado: Mensajes directos de error de PostgreSQL en el payload HTTP.",
      consecuencia: "Frontend robusto ante caídas de red o errores de validación, con mensajes claros para el usuario.",
      svg: '<svg viewBox="0 0 460 260" xmlns="http://www.w3.org/2000/svg"><rect width="460" height="260" rx="10" fill="#f8fafc" stroke="#e2e8f0"/><g transform="translate(40,50)"><rect width="380" height="150" rx="8" fill="#ffffff" stroke="#0c3564" stroke-width="2"/><text x="190" y="30" fill="#0c3564" font-size="12" font-weight="bold" text-anchor="middle">Estructura Uniforme de Error (RFC 7807)</text><rect x="30" y="50" width="320" height="70" rx="4" fill="#0f172a"/><text x="45" y="70" fill="#f43f5e" font-size="9" font-family="Consolas">statusCode: 400</text><text x="45" y="85" fill="#38bdf8" font-size="9" font-family="Consolas">error: "STOCK_INSUFICIENTE"</text><text x="45" y="100" fill="#e2e8f0" font-size="9" font-family="Consolas">message: "No hay unidades disponibles en lote"</text></g></svg>'
    },
    "12": {
      badge: "ADR-012 · Seguridad de Sesión",
      scope: "Ámbito: Autenticación & Anti-XSS",
      title: "Access Token en Memoria + Refresh Token en Cookie HttpOnly",
      contexto: "Vulnerabilidad clásica de almacenamiento de tokens JWT en localStorage frente a ataques XSS.",
      decision: "El Access Token solo vive en memoria de la SPA. El Refresh Token viaja en cookie HttpOnly con rotación atómica por cada uso.",
      tradeoff: "Descartado: Guardar JWT en localStorage o cookies accesibles por JavaScript.",
      consecuencia: "Reduce la exposición de credenciales ante XSS (el token no persiste en el navegador) y permite revocar sesiones invalidando el refresh token.",
      svg: '<svg viewBox="0 0 460 260" xmlns="http://www.w3.org/2000/svg"><rect width="460" height="260" rx="10" fill="#f8fafc" stroke="#e2e8f0"/><g transform="translate(30,40)"><rect width="180" height="160" rx="8" fill="#ffffff" stroke="#0c3564" stroke-width="2"/><text x="90" y="30" fill="#0c3564" font-size="11" font-weight="bold" text-anchor="middle">Access Token</text><text x="90" y="60" fill="#b4372e" font-size="10" font-weight="bold" text-anchor="middle">En Memoria RAM</text><text x="90" y="85" fill="#64748b" font-size="9" text-anchor="middle">Vida útil: 15 min</text><text x="90" y="110" fill="#059669" font-size="9" font-weight="bold" text-anchor="middle">No persiste en storage</text><text x="90" y="130" fill="#64748b" font-size="8" text-anchor="middle">apiFetch interceptor</text></g><path d="M 215 120 L 245 120" stroke="#0c3564" stroke-width="2"/><g transform="translate(250,40)"><rect width="180" height="160" rx="8" fill="#ffffff" stroke="#059669" stroke-width="2"/><text x="90" y="30" fill="#059669" font-size="11" font-weight="bold" text-anchor="middle">Refresh Token</text><text x="90" y="60" fill="#0c3564" font-size="10" font-weight="bold" text-anchor="middle">Cookie HttpOnly</text><text x="90" y="85" fill="#64748b" font-size="9" text-anchor="middle">SameSite=Strict · Secure</text><text x="90" y="110" fill="#059669" font-size="9" font-weight="bold" text-anchor="middle">Rotación en cada uso</text><text x="90" y="130" fill="#64748b" font-size="8" text-anchor="middle">sid inmutable</text></g></svg>'
    },
    "13": {
      badge: "ADR-013 · Superadministración",
      scope: "Ámbito: Plataforma Global SaaS",
      title: "Consola de Superadministración Global Independiente",
      contexto: "Gestión de múltiples organizaciones y aprovisionamiento SaaS sin mezclar permisos operativos.",
      decision: "Aplicación y sesión global en subdominio dedicado (admin.residar...) con bandera esSuperadmin.",
      tradeoff: "Descartado: Añadir roles de superadmin a los paneles asistenciales de las residencias.",
      consecuencia: "Separación clara entre la gestión de la plataforma SaaS y la operación clínica de cada residencia.",
      svg: '<svg viewBox="0 0 460 260" xmlns="http://www.w3.org/2000/svg"><rect width="460" height="260" rx="10" fill="#f8fafc" stroke="#e2e8f0"/><g transform="translate(40,40)"><rect width="380" height="170" rx="8" fill="#ffffff" stroke="#0c3564" stroke-width="2"/><text x="190" y="30" fill="#0c3564" font-size="11" font-weight="bold" text-anchor="middle">admin.residar... (Consola Global)</text><rect x="30" y="50" width="320" height="35" rx="4" fill="#fee2e2"/><text x="190" y="72" fill="#991b1b" font-size="10" font-weight="bold" text-anchor="middle">esSuperadmin = true (Bypass Total)</text><text x="190" y="115" fill="#334155" font-size="10" text-anchor="middle">Aprovisionamiento de Organizaciones &amp; Residencias</text><text x="190" y="135" fill="#64748b" font-size="9" text-anchor="middle">Separada de los paneles asistenciales</text></g></svg>'
    },
    "mail": {
      badge: "ADR-MAIL · Colas Transaccionales",
      scope: "Ámbito: Workers Asíncronos",
      title: "Cola Asíncrona de Correos con pg-boss",
      contexto: "Envío confiable de invitaciones y alertas sin bloquear las solicitudes HTTP ni requerir Redis externo.",
      decision: "Implementación de colas transaccionales utilizando la propia base PostgreSQL a través de pg-boss y un worker desacoplado.",
      tradeoff: "Descartado: Redis / RabbitMQ (infraestructura pesada innecesaria para el volumen del MVP).",
      consecuencia: "Reintentos automáticos, auditoría de envíos y arquitectura ligera alojada en el Homeserver UTN.",
      svg: '<svg viewBox="0 0 460 260" xmlns="http://www.w3.org/2000/svg"><rect width="460" height="260" rx="10" fill="#f8fafc" stroke="#e2e8f0"/><g transform="translate(40,40)"><rect width="380" height="170" rx="8" fill="#ffffff" stroke="#0c3564" stroke-width="2"/><text x="190" y="30" fill="#0c3564" font-size="11" font-weight="bold" text-anchor="middle">Cola Transaccional con pg-boss</text><g transform="translate(30,50)"><rect width="130" height="45" rx="4" fill="#dbeafe"/><text x="65" y="22" fill="#1e40af" font-size="9" font-weight="bold" text-anchor="middle">NestJS API</text><text x="65" y="36" fill="#1e40af" font-size="8" text-anchor="middle">Encola invitación</text></g><text x="175" y="75" fill="#64748b" font-size="14">→</text><g transform="translate(190,50)"><rect width="160" height="45" rx="4" fill="#fef3c7"/><text x="80" y="22" fill="#92400e" font-size="9" font-weight="bold" text-anchor="middle">pg-boss Worker</text><text x="80" y="36" fill="#92400e" font-size="8" text-anchor="middle">PostgreSQL Queues</text></g><text x="190" y="130" fill="#059669" font-size="10" font-weight="bold" text-anchor="middle">Reintentos automáticos · envíos persistidos en PostgreSQL</text></g></svg>'
    }
  };

  var adrPillarBtns = $$(".adr-pillar-btn");
  var adrSecPills = $$(".sec-pill");
  var adcBadge = $("#adcBadge");
  var adcScope = $("#adcScope");
  var adcTitle = $("#adcTitle");
  var adcContexto = $("#adcContexto");
  var adcDecision = $("#adcDecision");
  var adcTradeoff = $("#adcTradeoff");
  var adcConsecuencia = $("#adcConsecuencia");
  var adrSvgContainer = $("#adrSvgContainer");

  function setAdr(key) {
    var data = ADR_DATA[key] || ADR_DATA["1"];
    if (adcBadge) adcBadge.textContent = data.badge;
    if (adcScope) adcScope.textContent = data.scope || "Ámbito de Arquitectura";
    if (adcTitle) adcTitle.textContent = data.title;
    if (adcContexto) adcContexto.textContent = data.contexto;
    if (adcDecision) adcDecision.textContent = data.decision;
    if (adcTradeoff) {
      // El texto ya trae sus etiquetas ("Descartado:", "Trade-off:", "Ganancia:"); sólo se resaltan.
      adcTradeoff.innerHTML = (data.tradeoff || "").replace(/(Descartado|Trade-off|Ganancia):/g, "<b>$1:</b>");
    }
    if (adcConsecuencia) adcConsecuencia.textContent = data.consecuencia;
    if (adrSvgContainer && data.svg) {
      adrSvgContainer.innerHTML = data.svg;
    }

    adrPillarBtns.forEach(function (btn) {
      btn.classList.toggle("active", btn.dataset.adr === key);
    });

    adrSecPills.forEach(function (btn) {
      btn.classList.toggle("active", btn.dataset.adr === key);
    });
  }

  adrPillarBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      setAdr(btn.dataset.adr);
    });
  });

  adrSecPills.forEach(function (btn) {
    btn.addEventListener("click", function () {
      setAdr(btn.dataset.adr);
    });
  });

  // Inicializar con ADR-001
  setAdr("1");

  /* ==========================================================
     04b · EXPLORADOR DE ARQUITECTURA (SLIDE 10)
     ========================================================== */
  var ARCH_COMPONENTS = {
    "web": {
      stereo: "«SPA Institucional»",
      name: "Panel Web Institucional",
      desc: "Interfaz asistencial médica, control de residentes, asignación de camas y traspaso digital de guardias.",
      adr: "ADR-002: Next.js 14 App Router"
    },
    "portal": {
      stereo: "«Portal Público»",
      name: "Portal Familiar",
      desc: "Acceso acotado para familias (/publico) autenticado por DNI residente + familiar con token temporal de 15 min.",
      adr: "ADR-007 / ADR-012"
    },
    "global": {
      stereo: "«Consola Global»",
      name: "Superadministración SaaS",
      desc: "Panel independiente en subdominio global para dar de alta organizaciones, aprovisionar residencias y métricas.",
      adr: "ADR-013: Superadmin"
    },
    "bff": {
      stereo: "«BFF Proxy»",
      name: "Proxy Same-Origin",
      desc: "Servidor Next.js que reenvía peticiones al backend, inyecta cookies HttpOnly y previene fugas de tokens en navegador.",
      adr: "ADR-012: Sesión Segura"
    },
    "api": {
      stereo: "«Controladores REST»",
      name: "API REST Gateway",
      desc: "Controladores NestJS con validación exhaustiva de DTOs mediante ValidationPipe y class-validator.",
      adr: "ADR-002 / ADR-011"
    },
    "guards": {
      stereo: "«Security Pipeline»",
      name: "JwtAuthGuard & PermisosGuard",
      desc: "Cadena de seguridad global: valida token de memoria y comprueba permisos jerárquicos ABMC en JSONB.",
      adr: "ADR-006: RBAC JSONB"
    },
    "dom-cuid": {
      stereo: "«Dominio Clínico»",
      name: "Atención y Cuidados",
      desc: "Módulo asistencial: Historia Clínica inmutable, prescripciones horarias y registros de signos vitales al pie de cama.",
      adr: "ADR-010: Tratamientos"
    },
    "dom-stock": {
      stereo: "«Dominio Suministros»",
      name: "Operación de Stock Dual",
      desc: "Gestión diferenciada de Stock Central vs. Stock Individual de Residentes, lotes, vencimientos y firmas digitales.",
      adr: "ADR-007: Modelo de Stock"
    },
    "worker": {
      stereo: "«Worker Asíncrono»",
      name: "pg-boss Job Queues",
      desc: "Procesador en background para envío confiable de invitaciones y alertas transaccionales sin bloquear el hilo HTTP.",
      adr: "ADR-MAIL: pg-boss"
    },
    "prisma": {
      stereo: "«ORM Tipado»",
      name: "Prisma Client",
      desc: "Capa de acceso a datos con tipado estricto e inyección obligatoria del filtro residencia_id en toda consulta.",
      adr: "ADR-001: Multi-Tenancy"
    },
    "db": {
      stereo: "«Database Compartida»",
      name: "PostgreSQL 15 Relacional",
      desc: "Instancia única compartida con partición lógica por tenant (residencia_id). Costo de infraestructura contenido.",
      adr: "ADR-001: DB Compartida"
    },
    "r2": {
      stereo: "«StorageProvider Port»",
      name: "Cloudflare R2 Object Storage",
      desc: "Almacenamiento privado S3-compatible para contratos y fotos médicas con URLs temporales firmadas de 15 minutos.",
      adr: "ADR-009: R2 URLs Firmadas"
    },
    "mail": {
      stereo: "«MailTransport Port»",
      name: "Gmail API & Resend",
      desc: "Adaptadores desacoplados para el transporte de correo según el ambiente (desarrollo, pruebas o producción).",
      adr: "ADR-004 / ADR-MAIL"
    },
    "tunnels": {
      stereo: "«Edge Zero Trust»",
      name: "Cloudflare Tunnels",
      desc: "Túnel cifrado que expone *.residar.com al público con SSL automático sin abrir puertos en el router del servidor.",
      adr: "Infraestructura SaaS"
    },
    "docker": {
      stereo: "«Contenedores»",
      name: "Docker Compose",
      desc: "Topología contenerizada en red privada bridge para servicios backend, frontend y base de datos.",
      adr: "Topología UTN"
    },
    "homeserver": {
      stereo: "«Servidor Físico»",
      name: "Homeserver UTN",
      desc: "Servidor operativo en las instalaciones de la UTN FRC donde reside el entorno piloto de producción real.",
      adr: "UTN FRC 5K1 2026"
    }
  };

  var archFilterBtns = $$(".arch-filter-btn");
  var archNodeCards = $$(".arch-node-card");
  var hudCidStereo = $("#hudCidStereo");
  var hudCidName = $("#hudCidName");
  var hudCidDesc = $("#hudCidDesc");
  var hudCidAdr = $("#hudCidAdr");

  archFilterBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      archFilterBtns.forEach(function (b) { b.classList.remove("active"); });
      btn.classList.add("active");
      var flow = btn.dataset.flow;

      archNodeCards.forEach(function (card) {
        if (flow === "all") {
          card.classList.remove("arch-dimmed", "arch-highlight");
        } else {
          var flows = (card.dataset.flows || "").split(" ");
          if (flows.includes(flow)) {
            card.classList.remove("arch-dimmed");
            card.classList.add("arch-highlight");
          } else {
            card.classList.add("arch-dimmed");
            card.classList.remove("arch-highlight");
          }
        }
      });
    });
  });

  archNodeCards.forEach(function (card) {
    card.addEventListener("click", function () {
      archNodeCards.forEach(function (c) { c.classList.remove("selected"); });
      card.classList.add("selected");
      var cid = card.dataset.cid;
      var info = ARCH_COMPONENTS[cid];
      if (info) {
        if (hudCidStereo) hudCidStereo.textContent = info.stereo;
        if (hudCidName) hudCidName.textContent = info.name;
        if (hudCidDesc) hudCidDesc.textContent = info.desc;
        if (hudCidAdr) hudCidAdr.textContent = info.adr;
      }
    });
  });

  var btnOpenStarUmlModal = $("#btnOpenStarUmlModal");
  var btnCloseModalUml = $("#btnCloseModalUml");
  var modalUml = $("#modalUml");

  if (btnOpenStarUmlModal) {
    btnOpenStarUmlModal.addEventListener("click", function () {
      toggleModal(modalUml);
    });
  }

  if (btnCloseModalUml) {
    btnCloseModalUml.addEventListener("click", function () {
      closeModals();
    });
  }

  /* ==========================================================
     05 · GESTOR DE PASOS Y NAVEGACIÓN
     ========================================================== */
  function getSlideStepCount(slideIdx) {
    if (slideIdx === 2) return 5; // Slide 03: 5 etapas ciclo de vida
    if (slideIdx === 6) return 4; // Slide 07: 4 focos tablet
    return 1;
  }

  function applySlideStep(slideIdx, step) {
    if (slideIdx === 2) {
      var steps = $$("#slide-3 .journey-step");
      steps.forEach(function (s, i) {
        s.classList.toggle("active", i === step);
      });
    } else if (slideIdx === 6) {
      var keys = ["signos", "alertas", "foto", "guardia"];
      applyTabletSpot(keys[step] || "signos");
    }
  }

  function goToSlide(idx, resetStep) {
    if (idx < 0) idx = 0;
    if (idx >= totalSlides) idx = totalSlides - 1;

    currentSlide = idx;
    if (resetStep !== false) currentStep = 0;

    slides.forEach(function (slide, i) {
      slide.classList.toggle("active", i === currentSlide);
    });

    var activeSlide = slides[currentSlide];
    var isDark = activeSlide.dataset.dark === "true";
    document.body.classList.toggle("dark-slide", isDark);

    var title = activeSlide.dataset.title || ("Sección " + (currentSlide + 1));
    var eyebrow = activeSlide.dataset.eyebrow || "";
    if (hudSectionLabel) {
      hudSectionLabel.textContent = eyebrow || title;
    }
    // Deep-link (#7): si se recarga el navegador en plena defensa, vuelve a la misma slide
    if (window.history && history.replaceState) {
      history.replaceState(null, "", "#" + (currentSlide + 1));
    }
    if (slideCounter) {
      var num = (currentSlide + 1 < 10 ? "0" : "") + (currentSlide + 1);
      slideCounter.textContent = num + " / " + (totalSlides < 10 ? "0" : "") + totalSlides;
    }
    if (hudProgressFill) {
      var pct = ((currentSlide + 1) / totalSlides) * 100;
      hudProgressFill.style.width = pct + "%";
    }

    if (currentSlide === 0) {
      initParticles();
    } else {
      stopParticles();
    }

    applySlideStep(currentSlide, currentStep);
  }

  function next() {
    var maxSteps = getSlideStepCount(currentSlide);
    if (currentStep < maxSteps - 1) {
      currentStep++;
      applySlideStep(currentSlide, currentStep);
    } else if (currentSlide < totalSlides - 1) {
      goToSlide(currentSlide + 1);
    }
  }

  function prev() {
    if (currentStep > 0) {
      currentStep--;
      applySlideStep(currentSlide, currentStep);
    } else if (currentSlide > 0) {
      var prevIdx = currentSlide - 1;
      var prevMaxSteps = getSlideStepCount(prevIdx);
      goToSlide(prevIdx, false);
      currentStep = prevMaxSteps - 1;
      applySlideStep(prevIdx, currentStep);
    }
  }

  /* ==========================================================
     06 · ATAJOS DE TECLADO
     ========================================================== */
  window.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      closeModals();
      return;
    }

    // No interceptar combinaciones del navegador (Ctrl+F, Ctrl+R, Alt+←, etc.)
    if (e.ctrlKey || e.metaKey || e.altKey) return;

    if (e.key === "f" || e.key === "F") {
      toggleFullscreen();
      return;
    }

    if (e.key === "g" || e.key === "G") {
      toggleModal($("#modalGrid"));
      return;
    }

    if (e.key === "h" || e.key === "H" || e.key === "?") {
      toggleModal($("#modalHelp"));
      return;
    }

    // Con un modal abierto no se navega ni se disparan atajos de slide
    if ($(".modal-overlay.open")) return;

    if (e.key === "r" || e.key === "R") {
      goToSlide(currentSlide);
      return;
    }

    // Tecla D: Demo Timer (Slide 06)
    if ((e.key === "d" || e.key === "D") && currentSlide === 5) {
      toggleDemoTimer();
      return;
    }

    // Teclas 1 a 5: Hitos en slide 06 (Demo)
    if (currentSlide === 5 && ["1", "2", "3", "4", "5"].includes(e.key)) {
      var checkItem = $('.demo-check-item[data-key="' + e.key + '"]');
      if (checkItem) checkItem.classList.toggle("done");
      return;
    }

    // Teclas 1 a 4: Selección de ADR en Slide 09
    if (currentSlide === 8) {
      if (e.key === "1") { setAdr("1"); return; }
      if (e.key === "2" || e.key === "7") { setAdr("7"); return; }
      if (e.key === "3" || e.key === "8") { setAdr("8"); return; }
      if (e.key === "4" || e.key === "9") { setAdr("9"); return; }
    }

    // Teclas 1 a 5: Filtros de flujo en Slide 10 (Arquitectura)
    if (currentSlide === 9 && ["1", "2", "3", "4", "5"].includes(e.key)) {
      var flows = ["all", "clinical", "stock", "security", "cloud"];
      var flowKey = flows[parseInt(e.key, 10) - 1];
      var fBtn = $('.arch-filter-btn[data-flow="' + flowKey + '"]');
      if (fBtn) fBtn.click();
      return;
    }

    // Navegación
    if (["ArrowRight", "Space", "PageDown", "Enter"].includes(e.code) || e.key === " ") {
      e.preventDefault();
      next();
    } else if (["ArrowLeft", "PageUp", "Backspace"].includes(e.code)) {
      e.preventDefault();
      prev();
    } else if (e.key === "Home") {
      goToSlide(0);
    } else if (e.key === "End") {
      goToSlide(totalSlides - 1);
    }
  });

  /* ==========================================================
     07 · MODALES & FULLSCREEN
     ========================================================== */
  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(function () {});
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
    }
  }

  function toggleModal(modalEl) {
    if (!modalEl) return;
    var isOpen = modalEl.classList.contains("open");
    closeModals();
    if (!isOpen) modalEl.classList.add("open");
  }

  function closeModals() {
    $$(".modal-overlay").forEach(function (m) { m.classList.remove("open"); });
  }

  $$(".modal-overlay").forEach(function (overlay) {
    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) closeModals();
    });
  });

  var gridMenuContainer = $("#gridMenuContainer");
  if (gridMenuContainer) {
    slides.forEach(function (slide, idx) {
      var btn = document.createElement("button");
      btn.className = "grid-menu-btn";
      var num = (idx + 1 < 10 ? "0" : "") + (idx + 1);
      var title = slide.dataset.title || ("Sección " + num);
      btn.innerHTML = "<b>" + num + "</b><span>" + title + "</span>";
      btn.addEventListener("click", function () {
        goToSlide(idx);
        closeModals();
      });
      gridMenuContainer.appendChild(btn);
    });
  }

  var btnFullscreen = $("#btnFullscreen");
  var btnGrid = $("#btnGrid");
  var btnHelp = $("#btnHelp");
  var topBrand = $("#topBrand");

  if (btnFullscreen) btnFullscreen.addEventListener("click", toggleFullscreen);
  if (btnGrid) btnGrid.addEventListener("click", function () { toggleModal($("#modalGrid")); });
  if (btnHelp) btnHelp.addEventListener("click", function () { toggleModal($("#modalHelp")); });
  if (topBrand) topBrand.addEventListener("click", function (e) { e.preventDefault(); goToSlide(0); });

  var resizeTimer = null;
  window.addEventListener("resize", function () {
    fitStage();
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      if (currentSlide === 0) initParticles();
    }, 150);
  });

  var initialSlide = parseInt((location.hash || "").replace("#", ""), 10);
  goToSlide(initialSlide >= 1 && initialSlide <= totalSlides ? initialSlide - 1 : 0);

})();
