# residAR · Defensa interactiva, versión 2

Presentación HTML offline de Proyecto Final, Ingeniería en Sistemas de Información, UTN FRC · 5K1 · Grupo 3. Trabajo exclusivamente local. La versión anterior se conserva en `version-original/`.

## Abrir y compartir

1. Abrir `index.html` con Google Chrome. No requiere servidor, instalación ni Internet.
2. Usar F para pantalla completa; si Chrome la impide, usar F11.
3. Abrir el sistema residAR en otra ventana y alternar con Alt+Tab. La presentación no incluye ni simula el sistema real.
4. Para compartir, enviar `residar-offline.zip`, extraerlo completo y abrir su `index.html`. También se pueden copiar juntos `index.html`, `styles.css`, `app.js` y `assets/`. No enviar solamente el HTML.

La demo real puede requerir su propia conexión o entorno local: el funcionamiento offline corresponde a la presentación.

## Estructura final

Se eliminó la filmina del mapa de procesos. Quedan diez diapositivas:

1. Portada.
2. El problema real.
3. La solución residAR: el residente como hilo conductor.
4. Recorrido de la demo.
5. Gestión del proyecto: dos releases.
6. Arquitectura lógica.
7. Decisiones arquitectónicas.
8. Demo en vivo: placa de transición para alternar al sistema residAR.
9. Futuro de residAR.
10. Conclusiones y preguntas.

Los actores siguen visibles en el detalle de cada opción de demo. El índice, el contador y los atajos se ajustan a la nueva estructura.

## Demo: cuatro opciones

Se quitó únicamente «Acceso y contexto». Las opciones restantes son:

1. Ingreso del residente.
2. Planificación asistencial.
3. Medicación y seguimiento.
4. Gestión y administración.

Se conserva la distinción entre procesos asociados y funciones transversales. Gestión y administración no se presenta como un nuevo proceso formalmente modelado.

## Controles

- Flechas: avanzan o retroceden por los cuatro ítems internos de las filminas 4, 6 y 7; al terminar, pasan de diapositiva. Inicio/Fin: portada/cierre.
- D: volver a la demo. 1–4: elegir opción de demo, flujo o ADR según la filmina.
- [ / ]: opción anterior/siguiente de demo. C: marcar/desmarcar completada.
- Reiniciar recorrido: borrar las cuatro marcas y volver al ingreso.
- F: pantalla completa. L: luz del puntero. G: índice general. H/?: ayuda. Esc: cerrar diálogo.
- Tab/Shift+Tab: recorrer controles; Enter/Espacio activan el botón enfocado.
- R: repetir entrada visual. T: alternar residencia ilustrativa en ADR-001.

El acceso se realiza directamente en el sistema; ya no es una opción de esta filmina. El progreso de la estructura anterior se reinicia una única vez al cargar esta versión; luego se conserva normalmente.

## Estado y accesibilidad

El contexto de demo, los registros internos de lo demostrado y las selecciones de flujo y ADR se guardan en `localStorage` bajo `residar-defense-v2`. La URL `#1` a `#10` permite entrar a una diapositiva específica y tiene prioridad sobre la última visitada. La recuperación de estado no depende de Internet. En navegación privada, bloqueo de almacenamiento o ciertas políticas de archivos locales, el estado persiste solamente durante la vida de la pestaña; la ayuda informa la disponibilidad. Cambiar de equipo o mover el archivo puede cambiar el ámbito del almacenamiento.

Lienzo lógico de 1600 × 900 con escalado uniforme y franjas en pantallas de otra proporción. Montserrat y gráficos locales, sin CDNs. Se respeta movimiento reducido. Las diapositivas inactivas quedan fuera del foco y del árbol accesible. Los diálogos retienen el foco y bloquean los controles de fondo.

## Fuentes y límites

Se inspeccionaron README, HTML, CSS, JavaScript y todos los nombres de recursos del proyecto original. Los únicos recursos de dominio son la presentación y sus imágenes: no hay código del sistema ni matriz de permisos. Los BPMN de cuatro procesos fueron aportados en la conversación posterior. El encargo aportó los seis procesos y sus estados; los BPMN suministrados en el ajuste validan los actores de admisión, planificación, medicación y controles diarios. La presentación original aporta contexto, equipo, stack y ADRs como referencia histórica, no como verificación vigente. Consultar `VALIDACION.md` antes de la defensa.

Se reutilizan identidad, logo, fuente, formato y patrón de escalado; el motor se concentra en el nuevo recorrido y mantiene navegación, hash, pantalla completa y selección por teclado. Las capturas anteriores quedan disponibles en assets, pero no se presentan como evidencia actual.

## Identidad y participantes

Rojo institucional exacto #b4372e, sin recuadros blancos en los títulos. Luz del puntero opcional con L, apagada al recargar. Se oculta al salir del lienzo, cambiar de ventana o abrir un diálogo.

Actores de admisión: Familiar o interesado, Supervisor, Médico, Psicólogo. Planificación: Familia o responsable del residente, Médico y Supervisor. Medicación y controles: Personal de cuidados. En controles, la comunicación posterior al supervisor y/o médico no los convierte en lanes principales.



## Últimos ajustes de diseño y contenido

- Fondo blanco exacto en las filminas de contenido. Portada, transición a la demo y cierre mantienen el azul profundo.
- Portada sin «La información correcta. En cada momento del cuidado.»; nombres de 18 px y roles de 15 px en el lienzo lógico.
- Demo: cuatro opciones con título, descripción breve, procesos asociados y roles. Se retiraron el bloque de pantallas, la frase de enlace, el conteo y las acciones del panel de detalle. La selección por teclado y el guardado siguen activos; el reinicio está en Ayuda.
- Gestión del proyecto: 14 sprints en dos releases, siguiendo la imagen provista por el equipo. Release 1 (sprints 1–7): MVP y piloto Espinosa. Release 2 (sprints 8–14): Hardening y SaaS, multitenancy, R2, workers y superadministración. Se mantienen +290 issues, Planning Poker, INVEST/DoD y PRs cruzados con CI/CD.

Corrección vigente de roles: admisión incluye Familiar o interesado, Supervisor, Médico y Psicólogo. El cuarto elemento de demo muestra Personal de cuidados. La arquitectura no presenta textos debajo de sus diagramas; los ADRs siguen el orden 001, 007, 008 y 009 de la nueva referencia.

Filmina 8: placa de transición para presentar la demo en vivo. Filmina 9: cinco ejes de evolución (portal familiar, IaC/provisión SaaS, Superadmin/CRM, facturación/obras sociales y plugins/IoT), más el estado del software, siguiendo la referencia aportada por el equipo. Los detalles se reservan a la exposición oral.

Las referencias a números de filminas en ajustes anteriores son históricas; la numeración vigente es la de la estructura final de diez diapositivas.
