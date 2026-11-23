# residAR · Presentación de Defensa Oral de Proyecto Final

Presentación web interactiva para la defensa de Tesis de Grado (**Ingeniería en Sistemas de Información · UTN FRC · Comisión 5K1 · Grupo 3**).

**100% Offline**: HTML5 + CSS3 + JavaScript nativo. Sin dependencias externas, sin conexión a internet requerida.

---

## 👥 Equipo y Roles Reales

- **Joaquín Gonzalez Zanotti**: Desarrollador · Infraestructura · Product Owner
- **Marilina Aramayo**: QA · UX · Project Manager
- **Gonzalo Zavala**: Backend Developer · Scrum Master
- **Facundo Andrés Martínez Dalke**: Backend Developer
- **Matías Valentín Palacios**: Frontend Developer

---

## 🎨 Identidad Oficial de residAR

- **Azul Marino Principal (`--brand-navy`)**: `#0c3564` (Seriedad institucional, confianza clínica).
- **Rojo Carmesí Asistencial (`--brand-red`)**: `#b4372e` (Pulso vital, alertas clínicas y seguridad asistencial).
- **Fondo Clínico Ultra Limpio (`--surface-base`)**: `#f8fafc` (Máximo contraste en proyector sin fatiga visual).
- **Fondo Técnico Profundo (`--brand-navy-dark`)**: `#071e3d` (Para el Cockpit de Demo y la Arquitectura).

---

## 🏛️ Las 12 Diapositivas

1. **01 · Portada & Pulso Vital**: Partículas duales convergiendo en el logo vectorial transparente de residAR, monitor de ECG y créditos reales del equipo.
2. **02 · Origen y Contexto de Dominio**: El caso piloto Residencias Espinosa (4 sedes, +80 residentes), el marco regulatorio (Leyes 26.529 y 25.326) y las 4 fricciones analógicas.
3. **03 · El Ciclo de Vida del Residente**: El viaje integral de 5 etapas: Postulación → Admisión → Cuidados → Suministros/Stock → Egreso.
4. **04 · Gestión Ágil de Proyecto**: 14 Sprints en 2 Releases (Release 1 MVP + Release 2 Hardening/SaaS), +290 issues en Jira, INVEST, DoD y PRs cruzados.
5. **05 · Alcance Funcional del ERP**: Matriz de dos ejes: Eje Asistencial (Pie de cama) vs. Eje Operativo (Gestión edilicia).
6. **06 · DEMO EN VIVO (Cockpit 11 min)**: Cronómetro interactivo de 11 minutos (`tecla D`) y hoja de ruta de 5 hitos con teclas `1` a `5`.
7. **07 · Control Diario y Pase de Guardia**: Mockup interactivo de la tablet de enfermería pie de cama (signos vitales, alertas y pase de turno).
8. **08 · Modelo de Stock y Medicación (ADR-007)**: Stock Central vs. Stock Individual de Residentes, lotes con vencimiento, recepción con firma/foto y consumo por administración.
9. **09 · Cockpit de Decisiones Arquitectónicas (ADRs)**: Explorador interactivo con micro-diagramas vectoriales dedicados para las 4 ADRs clave: ADR-001 (Multi-Tenancy por BD Compartida), ADR-007 (Subdominios & Stock Dual), ADR-008 (Residencia Activa & Rol) y ADR-009 (Storage Cloud R2 con URLs firmadas), más un catálogo interactivo de las otras 8 ADRs. Teclas `1` a `4` para alternar al instante.
10. **10 · Diagrama de Arquitectura Lógica de Componentes**: Diagrama original diseñado a medida con 4 capas integradas (Canales Next.js, Backend NestJS, Persistencia PostgreSQL/R2 e Infraestructura UTN/Cloudflare). Incluye filtros interactivos por flujo de datos (Clínico, Stock, Seguridad, Cloud) e inspector dinámico de componentes, con acceso opcional al modelo formal StarUML.
11. **11 · El Futuro de residAR (Roadmap de Producto & Escalabilidad SaaS)**: Los 5 vectores de expansión estratégica hacia un producto SaaS de escala nacional (Portal Familiar Autónomo, IaC Terraform/Ansible, Superadmin & CRM SaaS, Facturación AFIP/ARCA y Ecosistema de Plugins IoT), junto con el banner de validación técnica en Homeserver UTN.
12. **12 · Conclusiones e Impacto del Proyecto**: Cierre de la defensa oral con los 4 pilares de valor de ingeniería (Impacto humano real, Trazabilidad inmutable, Arquitectura SaaS desacoplada y Rigor ágil Scrum) y apertura de la ronda de preguntas ante el tribunal.

---

## 🎬 Camino Feliz Recomendado para la Demo en Vivo (10.5 min)

1. **Admisión y Habitación (2 min):** Ingreso formal de un nuevo residente (Manuel Belgrano, 82 años), asignación de cama en habitación 102 y apertura de Historia Clínica Digital.
2. **Ficha y Prescripción Médica (2 min):** Consulta de gustos/molestias y prescripción médica de un tratamiento diario por horario (*Enalapril 10mg*, 08:00 hs).
3. **Recepción de Stock con Firma (2 min):** Carga del lote de medicación individual traído por la familia con comprobante fotográfico y vencimiento (ADR-007).
4. **Control Diario al Pie de Cama (2.5 min):** Carga de signos vitales (presión, glucemia) con simulación de alerta clínica y registro de la toma programada descontando 1 unidad del lote.
5. **Traspaso de Guardia Digital (2 min):** Cierre del turno mañana con novedades consolidadas y firma digital.

---

## ⌨️ Atajos de Teclado

- `→` / `Espacio` / `Enter`: Avanzar slide o paso interactivo
- `←`: Retroceder slide o paso
- `F`: Alternar **Pantalla Completa**
- `G`: Abrir **Índice de Diapositivas**
- `H` / `?`: Ventana de **Ayuda**
- `D`: Iniciar / Pausar cronómetro de Demo (Slide 06)
- `1` a `5`: Tildar hitos de Demo (Slide 06)
- `Esc`: Cerrar menús
