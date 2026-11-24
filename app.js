/* residAR · Local presentation engine. No network, framework or application simulation. */
(() => {
  'use strict';
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const slides = $$('.slide');
  const demoSlide = slides.findIndex(s => s.classList.contains('demo'));
  const architectureSlide = slides.findIndex(s => s.classList.contains('architecture'));
  const adrSlide = slides.findIndex(s => s.querySelector('.adr-layout'));
  const storageKey = 'residar-defense-v2';
  let storageAvailable = true;
  let state = { deckVersion: 3, demoVersion: 4, slide: 0, demo: 0, completed: [], flow: 0, adr: 0, tenant: 0 };
  const bounded = (value, max) => Number.isInteger(value) && value >= 0 && value <= max;
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || 'null');
    if (saved && typeof saved === 'object') {
      // Version 3 inserts the live-demo divider before the former slide 8.
      if (saved.deckVersion === 2 && Number.isInteger(saved.slide) && saved.slide >= 7) saved.slide += 1;
      for (const [key, max] of Object.entries({ slide: slides.length - 1, demo: 3, flow: 3, adr: 3, tenant: 1 })) {
        if (bounded(saved[key], max) && (key !== "demo" || saved.demoVersion === 4)) state[key] = saved[key];
      }
      if (saved.demoVersion === 4 && Array.isArray(saved.completed)) state.completed = [...new Set(saved.completed.filter(x => bounded(x, 3)))];
    }
  } catch { storageAvailable = false; }
  const save = () => {
    try { localStorage.setItem(storageKey, JSON.stringify(state)); }
    catch { storageAvailable = false; }
    $('#storageNotice').textContent = storageAvailable ? 'Guardado local activo en este navegador.' : 'Guardado persistente no disponible. El estado se conserva mientras esta pestaña permanezca abierta.';
  };
  const fit = () => document.documentElement.style.setProperty('--stage-scale', Math.min(innerWidth / 1600, innerHeight / 900));
  addEventListener('resize', fit);
  document.addEventListener('fullscreenchange', fit);
  fit();
  let toastTimeout;
  function toast(message) {
    $('#toast').textContent = message;
    $('#toast').classList.add('visible');
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => $('#toast').classList.remove('visible'), 2600);
  }

  // Business participants validated by the supplied BPMNs. These are not permission roles.
  const businessActors = {
    admission: ['Familiar o interesado', 'Supervisor', 'Médico', 'Psicólogo'],
    treatment: ['Familia o responsable del residente', 'Médico', 'Supervisor'],
    medication: ['Personal de cuidados'],
    daily: ['Personal de cuidados']
  };
  const actorChips = actors => `<div class="actor-chips">${actors.map(name => `<span class="actor-chip">${name}</span>`).join('')}</div>`;
  function animateStep(selector) {
    const element = $(selector);
    if (!element || !element.closest('.slide')?.classList.contains('active')) return;
    element.classList.remove('step-change');
    void element.offsetWidth;
    element.classList.add('step-change');
  }
  const laser = $('#laserPointer');
  let laserEnabled = false;
  let pointerPosition = null;
  function positionLaser() {
    const rect = $('#stage').getBoundingClientRect();
    const point = pointerPosition;
    if (!laserEnabled || !point || point.x < rect.left || point.x > rect.right || point.y < rect.top || point.y > rect.bottom || document.querySelector('dialog[open]')) {
      laser.hidden = true;
      return;
    }
    laser.style.left = `${(point.x - rect.left) * 1600 / rect.width}px`;
    laser.style.top = `${(point.y - rect.top) * 900 / rect.height}px`;
    laser.hidden = false;
  }
  $('#stage').addEventListener('pointermove', e => {
    if (e.pointerType === 'touch') return;
    pointerPosition = {x:e.clientX, y:e.clientY};
    positionLaser();
  });
  $('#stage').addEventListener('pointerleave', () => {pointerPosition = null; laser.hidden = true;});
  addEventListener('blur', () => {pointerPosition = null; laser.hidden = true;});
  addEventListener('resize', () => {pointerPosition = null; laser.hidden = true;});
  document.addEventListener('visibilitychange', () => {pointerPosition = null; laser.hidden = true;});
  function toggleLaser() {
    laserEnabled = !laserEnabled;
    positionLaser();
    toast(laserEnabled ? 'Puntero luminoso activado' : 'Puntero luminoso desactivado');
  }

  const demos = [
    { name: 'Ingreso del residente', short: 'Solicitud · Admisión · Perfil', title: 'Una solicitud se convierte en estadía.', purpose: 'Conectar la evaluación de una solicitud con el ingreso formal y el perfil del residente.', process: 'Gestionar admisión de residentes.', actors: businessActors.admission },
    { name: 'Planificación asistencial', short: 'Historia clínica · Tratamientos', title: 'Conocer para planificar el cuidado.', purpose: 'Consultar la información clínica y contextualizar la planificación del tratamiento.', process: 'Planificar tratamientos.', actors: businessActors.treatment },
    { name: 'Medicación y seguimiento', short: 'Stock · Medicación · Controles', title: 'De la planificación al cuidado diario.', purpose: 'Relacionar tratamiento, disponibilidad de medicamentos y seguimiento cotidiano.', process: 'Administrar medicación a residentes · Realizar controles diarios de residentes.', actors: businessActors.medication },
    { name: 'Gestión y administración', short: 'Reportes · Configuración · Usuarios', title: 'Una visión que también ayuda a gestionar.', purpose: 'Cerrar con un ejemplo de información para la gestión y las herramientas de administración.', process: 'Funciones transversales; no se agrega un séptimo proceso.', actors: businessActors.daily }
  ];
  $('#demoStages').innerHTML = demos.map((d, i) => `<button class="stage-button" data-demo="${i}"><span class="stage-number">${i + 1}</span><span><b>${d.name}</b><small>${d.short}</small></span></button>`).join('');
  function setDemo(i) {
    if (!bounded(i, demos.length - 1)) return;
    state.demo = i;
    const d = demos[i];
    for (const [id, text] of Object.entries({demoKicker: `MOMENTO ${String(i + 1).padStart(2, '0')} · DEMOSTRACIÓN EN EL SISTEMA`, demoTitle:d.title, demoPurpose:d.purpose, demoProcess:d.process})) $('#' + id).textContent = text;
    $('#demoActors').innerHTML = Array.isArray(d.actors) ? actorChips(d.actors) : `<span>${d.actors}</span>`;
    $$('[data-demo]').forEach(b => {
      const index = +b.dataset.demo, active = index === i, done = state.completed.includes(index);
      b.classList.toggle('active', active); b.classList.toggle('done', done); b.setAttribute('aria-pressed', active);
      b.setAttribute('aria-label', `${index + 1}. ${demos[index].name}${done ? ', completada' : ''}${active ? ', etapa activa' : ''}`);
      $('.stage-button[data-demo="' + index + '"] .stage-number').textContent = index + 1;
    });
    animateStep('.demo-detail');
    save();
  }
  function completeDemo() {
    const done = state.completed.includes(state.demo);
    state.completed = done ? state.completed.filter(x => x !== state.demo) : [...state.completed, state.demo];
    setDemo(state.demo);
    toast(done ? 'Etapa desmarcada' : 'Etapa completada. Elegí el próximo momento.');
  }

  const flowNames = ['', 'clinical', 'security', 'files'];
  function setFlow(i) {
    if (!bounded(i, 3)) return;
    state.flow = i;
    $$('[data-flow]').forEach(b => {const active = +b.dataset.flow === i; b.classList.toggle('active', active); b.setAttribute('aria-pressed', active);});
    $$('[data-flows], [data-edge]').forEach(el => el.classList.toggle('dimmed', i !== 0 && !(el.dataset.flows || el.dataset.edge).split(' ').includes(flowNames[i])));
    $$('[data-component]').forEach(b => b.classList.remove('selected'));
    animateStep('.arch-canvas');
    save();
  }

  const adrs = [
    {title:'Multi-Tenancy Aislado', decision:'Una base PostgreSQL compartida; residencia_id como tenant operativo y organizacion_id como agrupador superior.', tradeoff:'Menos infraestructura por residencia; exige filtrar y validar el contexto en cada operación.', validation:'Validar consultas, guards y esquema vigente.', diagram:() => `<p class="mini-title">EJEMPLO CONCEPTUAL · NO ES UNA PRUEBA DE SEGURIDAD</p><div class="tenant-tabs"><button data-tenant="0">A · Seleccionar</button><button data-tenant="1">B · Seleccionar</button></div><div class="mini-box accent" id="tenantRequest"></div><div class="mini-connector"></div><div class="mini-box">PostgreSQL compartido<small>Datos separados lógicamente por residencia</small></div><div class="tenant-data"><span data-tenant-data="0">Residencia A</span><span data-tenant-data="1">Residencia B</span></div><p class="mini-title">Residencias A y B · Contexto ilustrativo</p>` },
    {title:'Subdominios & Stock Dual', decision:'Stock central de la residencia y stock individual del residente, con lotes y vencimientos según el material original.', tradeoff:'Distinguir la procedencia y el propietario al relacionar disponibilidad y administración de medicación.', validation:'Validar recepción, consumo y alcance vigente.', diagram:() => '<div class="mini-pair"><div class="mini-box">Central<small>Residencia</small></div><div class="mini-box red">Individual<small>Residente</small></div></div><div class="mini-connector"></div><div class="mini-box accent">Disponibilidad de medicamentos<small>Lotes · Vencimientos</small></div><div class="mini-connector"></div><div class="mini-box">Atención del residente</div>'},
    {title:'Residencia Activa & Rol', decision:'Residencia activa y permisos efectivos en la sesión, según ADR-008 de la presentación original.', tradeoff:'El contexto debe ser consistente entre la interfaz, la sesión y las validaciones del backend.', validation:'Validar sesión y matriz real de permisos.', diagram:() => '<div class="mini-box">Usuario</div><div class="mini-connector"></div><div class="mini-box accent">Residencia activa</div><div class="mini-connector"></div><div class="mini-box red">Permisos efectivos<small>Sin asignar roles ni permisos supuestos</small></div>'},
    {title:'Storage Cloud Seguro (R2)', decision:'Cloudflare R2 para objetos; acceso mediante URLs firmadas según ADR-009 de la versión original.', tradeoff:'Gestionar autorizaciones y vencimiento del acceso, además de la consistencia entre referencias y archivos.', validation:'Validar políticas, expiración y flujo de acceso.', diagram:() => '<div class="mini-box">Aplicación<small>Autorización de acceso</small></div><div class="mini-connector"></div><div class="mini-box red">URL firmada<small>Acceso temporal según diseño original</small></div><div class="mini-connector"></div><div class="mini-box accent">Cloudflare R2<small>Almacenamiento de objetos</small></div>'}
  ];
  function setTenant(i) {
    state.tenant = i;
    if ($('#tenantRequest')) $('#tenantRequest').textContent = `Contexto activo: residencia ${i ? 'B' : 'A'}`;
    $$('[data-tenant]').forEach(b => {const active = +b.dataset.tenant === i; b.classList.toggle('active', active); b.setAttribute('aria-pressed', active);});
    $$('[data-tenant-data]').forEach(b => b.classList.toggle('active', +b.dataset.tenantData === i));
    save();
  }
  function setAdr(i) {
    if (!bounded(i, 3)) return;
    state.adr = i;
    const d = adrs[i];
    $('#adrDiagram').setAttribute('aria-label', d.title);
    $('#adrDiagram').innerHTML = d.diagram();
    $$('[data-adr]').forEach(b => {const active = +b.dataset.adr === i; b.classList.toggle('active', active); b.setAttribute('aria-pressed', active);});
    if (i === 0) setTenant(state.tenant);
    animateStep('.adr-diagram');
    save();
  }

  let openDialog = null, returnFocus = null;
  function closeDialog(restore = true) {
    if (!openDialog) return;
    openDialog.close(); openDialog = null;
    $$('header, main, footer').forEach(el => el.inert = false);
    if (restore && returnFocus?.isConnected && !returnFocus.closest('[inert]')) returnFocus.focus();
  }
  function showDialog(id) {
    if (openDialog) { const same = openDialog.id === id; closeDialog(); if (same) return; }
    returnFocus = document.activeElement;
    openDialog = $('#' + id);
    openDialog.setAttribute('role', 'dialog'); openDialog.setAttribute('aria-modal', 'true');
    openDialog.setAttribute('aria-label', openDialog.querySelector('h2').textContent);
    $$('header, main, footer').forEach(el => el.inert = true);
    laser.hidden = true;
    openDialog.show();
    openDialog.querySelector('button').focus();
  }
  let slideTransitionTimer;
  function goToSlide(i) {
    if (!bounded(i, slides.length - 1)) return;
    closeDialog(false);
    const previousIndex = slides.findIndex(s => s.classList.contains('active'));
    const direction = previousIndex < i ? 'forward' : 'backward';
    const shouldAnimate = previousIndex >= 0 && previousIndex !== i;
    clearTimeout(slideTransitionTimer);
    slides.forEach(s => s.classList.remove('enter-forward', 'enter-backward', 'leave-forward', 'leave-backward', 'leaving'));
    state.slide = i;
    if (shouldAnimate) {
      const firstStep = direction === 'forward' ? 0 : 3;
      if (i === demoSlide) setDemo(firstStep);
      else if (i === architectureSlide) setFlow(firstStep);
      else if (i === adrSlide) setAdr(firstStep);
    }
    if (document.activeElement?.closest('.slide')) document.activeElement.blur();
    slides.forEach((s, n) => {
      const isNext = n === i;
      s.classList.toggle('active', isNext);
      s.inert = !isNext;
      s.setAttribute('aria-hidden', !isNext);
    });
    if (shouldAnimate) {
      const previous = slides[previousIndex];
      const next = slides[i];
      previous.classList.add('leaving', `leave-${direction}`);
      next.classList.add(`enter-${direction}`);
      slideTransitionTimer = setTimeout(() => {
        previous.classList.remove('leaving', `leave-${direction}`);
        next.classList.remove(`enter-${direction}`);
      }, 680);
    }
    $('#stage').classList.toggle('is-dark', slides[i].classList.contains('dark'));
    $('#slideCounter').textContent = `${String(i + 1).padStart(2, '0')} / ${String(slides.length).padStart(2, '0')}`;
    $('#actLabel').textContent = slides[i].dataset.act;
    $('#previous').disabled = i === 0; $('#next').disabled = i === slides.length - 1;
    $$('[data-go]').forEach(b => {const current = +b.dataset.go === i; b.classList.toggle('current', current); if(current) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current');});
    const hash = '#' + (i + 1);
    if (location.hash !== hash) {try {history.replaceState(null, '', hash);} catch {location.hash = hash;}}
    document.title = `residAR · ${i + 1}. ${slides[i].dataset.title}`;
    save();
  }
  slides.forEach((s, i) => {
    const name = s.dataset.title;
    $('#slideIndex').insertAdjacentHTML('beforeend', `<button data-go="${i}"><span>${String(i + 1).padStart(2, '0')}</span>${name}</button>`);
    $('#progress').insertAdjacentHTML('beforeend', `<button data-go="${i}" aria-label="${i + 1}. ${name}"></button>`);
  });
  async function fullscreen() {
    try { if (document.fullscreenElement) await document.exitFullscreen(); else await document.documentElement.requestFullscreen(); }
    catch {toast('Pantalla completa no disponible. Podés usar F11 en Chrome.');}
  }
  function navigate(direction) {
    if (direction > 0) {
      if (state.slide === demoSlide && state.demo < demos.length - 1) return setDemo(state.demo + 1);
      if (state.slide === architectureSlide && state.flow < 3) return setFlow(state.flow + 1);
      if (state.slide === adrSlide && state.adr < adrs.length - 1) return setAdr(state.adr + 1);
    } else {
      if (state.slide === demoSlide && state.demo > 0) return setDemo(state.demo - 1);
      if (state.slide === architectureSlide && state.flow > 0) return setFlow(state.flow - 1);
      if (state.slide === adrSlide && state.adr > 0) return setAdr(state.adr - 1);
    }
    goToSlide(state.slide + direction);
  }
  document.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b || b.disabled) return;
    if (b.hasAttribute('data-close')) return closeDialog();
    for (const [key, fn] of Object.entries({go:goToSlide, demo:setDemo, flow:setFlow, adr:setAdr, tenant:setTenant})) {
      if (b.dataset[key] !== undefined) return fn(+b.dataset[key]);
    }
    if (b.dataset.component !== undefined) {
      $$('[data-component]').forEach(node => node.classList.toggle('selected', node === b));
      return;
    }
    const actions = {previous:()=>navigate(-1), next:()=>navigate(1), demoShortcut:()=>goToSlide(demoSlide), gridButton:()=>showDialog('indexDialog'), helpButton:()=>showDialog('helpDialog'), fullButton:fullscreen, completeDemo, nextDemo:()=>setDemo(state.demo+1), resetDemo:()=>showDialog('resetDialog'), confirmReset:()=>{state.completed=[];setDemo(0);closeDialog();toast('Recorrido reiniciado');}, formalButton:()=>showDialog('formalDialog')};
    if (actions[b.id]) actions[b.id]();
  });
  document.addEventListener('keydown', e => {
    if (e.ctrlKey || e.altKey || e.metaKey || e.isComposing) return;
    const key = e.key.toLowerCase();
    if (openDialog) {
      if (key === 'escape') {e.preventDefault();closeDialog();}
      if (key === 'tab') {
        const focusable = [...openDialog.querySelectorAll('button:not(:disabled), [href], input')];
        const index = focusable.indexOf(document.activeElement);
        if (e.shiftKey && index <= 0) {e.preventDefault();focusable.at(-1).focus();}
        else if (!e.shiftKey && index === focusable.length-1) {e.preventDefault();focusable[0].focus();}
      }
      return;
    }
    if (e.target.matches('input, textarea, select, [contenteditable="true"]')) return;
    // Preserve native Enter/Space behavior on buttons to prevent double navigation.
    if (e.target.closest('button') && ['enter',' '].includes(key)) return;
    let handled = true;
    if (['arrowright','pagedown',' ','enter'].includes(key)) navigate(1);
    else if (['arrowleft','pageup'].includes(key)) navigate(-1);
    else if (key === 'home') goToSlide(0);
    else if (key === 'end') goToSlide(slides.length - 1);
    else if (key === 'd') goToSlide(demoSlide);
    else if (key === 'g') showDialog('indexDialog');
    else if (['h','?'].includes(key)) showDialog('helpDialog');
    else if (key === 'f') fullscreen();
    else if (key === 'l') {if (!e.repeat) toggleLaser();}
    else if (key === 'r') {const s=slides[state.slide];s.classList.remove('active');void s.offsetWidth;s.classList.add('active');}
    else if (state.slide === demoSlide && key === 'c') {if(!e.repeat) completeDemo();}
    else if (state.slide === demoSlide && ['[',']'].includes(key)) setDemo(state.demo + (key === ']' ? 1 : -1));
    else if (state.slide === adrSlide && state.adr === 0 && key === 't') setTenant(1-state.tenant);
    else if (/^[1-5]$/.test(key)) {
      const n = +key-1;
      if (state.slide === demoSlide) setDemo(n);
      else if (state.slide === architectureSlide) setFlow(n);
      else if (state.slide === adrSlide) setAdr(n);
      else handled = false;
    } else handled = false;
    if (handled) e.preventDefault();
  });
  function hashSlide() {const match=location.hash.match(/^#(\d+)$/);return match && bounded(+match[1]-1,slides.length - 1) ? +match[1]-1 : null;}
  addEventListener('hashchange',()=>{const i=hashSlide();if(i!==null)goToSlide(i);});
  setDemo(state.demo); setFlow(state.flow); setAdr(state.adr);
  const initialSlide = hashSlide() ?? state.slide;
  goToSlide(initialSlide);
})();

