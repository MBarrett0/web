// COPY DEL SITIO — editar acá. Voseo, sin clichés, lenguaje llano.
export const copy = {
  brand: 'NOMBRE', // placeholder de marca hasta que el usuario la defina
  hero: {
    kicker: 'Desarrollo de software para negocios reales',
    title: 'Tu negocio atiende solo, incluso cuando vos no llegás.',
    lead: 'Automatizo la atención, las reservas y los turnos de tu negocio, y creo la página que lo sostiene. Vos seguís con lo tuyo; el sistema responde por vos.',
    ctaPrimary: 'Contame tu caso',
    ctaSecondary: 'Ver cómo funciona',
  },
  services: [
    { num: '01', anchor: '#automatizacion', title: 'Automatización de servicios', line: 'Consultas respondidas, recordatorios enviados y datos cargados sin que nadie tenga que acordarse.', demo: 'Ver la diferencia' },
    { num: '02', anchor: '#whatsapp', title: 'Reservas por WhatsApp', line: 'Tus clientes reservan por donde ya te escriben. Sin apps nuevas: el turno queda agendado en la misma conversación.', demo: 'Ver una reserva real' },
    { num: '03', anchor: '#turnos', title: 'Gestión de turnos', line: 'Confirmaciones, recordatorios y cancelaciones resueltas solas, sin llamadas ni cuaderno.', demo: 'Ver la agenda en acción' },
    { num: '04', anchor: '#web', title: 'Creación de páginas web', line: 'Una web que trabaja, no que decora: pensada para que te encuentren, te entiendan y te escriban.', demo: 'Ver un sitio vivo' },
  ],
  process: {
    title: 'Cómo trabajamos',
    sub: 'Cuatro pasos, sin vueltas. En cada uno sabés qué te toca a vos y qué me toca a mí.',
    steps: [
      { t: 'Contás tu caso', you: 'Me escribís qué te está sacando tiempo.', me: 'Te respondo con qué conviene automatizar y qué no vale la pena.' },
      { t: 'Definimos el alcance', you: 'Elegís qué resolver primero.', me: 'Te paso una propuesta cerrada: qué incluye, cuánto demora y cuánto sale.' },
      { t: 'Desarrollo', you: 'Seguís trabajando normal.', me: 'Armo todo y te muestro avances para ajustar temprano.' },
      { t: 'Lanzamiento', you: 'Lo usás con clientes reales.', me: 'Quedo cerca el primer tiempo para ajustar lo que aparezca.' },
    ],
  },
  plans: {
    title: 'Tres puntos de partida',
    sub: 'Cada propuesta se cotiza según tu caso: no hay precios de lista porque no hay dos negocios iguales.',
    items: [
      { name: 'Presencia', who: 'Para el negocio que hoy no aparece en Google o depende de Instagram.', includes: ['Página web completa', 'Dominio y hosting configurados', 'Formulario de contacto que llega a tu mail', 'Textos trabajados con vos'], service: 'Creación de página web' },
      { name: 'Atención automática', who: 'Para el que pierde consultas por no llegar a responder.', includes: ['Respuestas automáticas por WhatsApp', 'Reservas dentro de la conversación', 'Recordatorios a clientes', 'Sin cambiar tu número'], service: 'Reservas por WhatsApp' },
      { name: 'Operación completa', who: 'Para el que quiere el circuito entero andando solo.', includes: ['Web + WhatsApp + agenda integrados', 'Gestión de turnos con reasignación', 'Panel simple para ver todo', 'Soporte el primer tiempo'], service: 'Automatización de servicios' },
    ],
    cta: 'Pedir propuesta',
  },
  contact: {
    title: 'Contame tu caso',
    sub: 'Sin compromiso: leés mi respuesta y decidís. Si tu caso no lo puedo resolver bien, también te lo digo.',
    email: 'matias.barretto@gmail.com',
    services: ['Creación de página web', 'Reservas por WhatsApp', 'Gestión de turnos', 'Automatización de servicios', 'Todavía no sé / un combo'],
  },
  footer: { note: 'Desarrollo de software a medida · Uruguay' },
} as const;
