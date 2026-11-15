// The Pattern Audit questionnaire (thank-you page, after the one-click purchase).
// types: one (single choice), many (multi choice), scale (never → always), text (open answer)
// Edit wording here; the page and the email to the inbox both read from this file.
window.AUDIT_QUESTIONS = {
  en: {
    intro: "this takes about 8 minutes. the more honest and specific you are, the more exact your audit will be. nobody sees this but me.",
    next: 'next', back: 'back', send: 'send my answers', sending: 'sending…', optional: 'optional', required: 'answer this one to continue.',
    scale: ['never', 'sometimes', 'often', 'always'],
    sections: [
      { title: 'where it started', questions: [
        { id: 'place', type: 'one', q: 'where are you in your family?', o: ['the eldest daughter', 'an only child', 'not the eldest, but i was the responsible one'] },
        { id: 'gap', type: 'one', q: 'how much older are you than the next sibling?', o: ['less than 2 years', '2 to 5 years', '6 to 10 years', 'more than 10 years', 'no siblings'] },
        { id: 'who', type: 'many', q: 'who needed you most growing up?', o: ['my mom', 'my dad', 'my siblings', 'my grandparents', 'the whole house'] },
        { id: 'jobs', type: 'many', q: 'what did you do for them?', o: ['cooking, cleaning, chores', 'looking after my siblings', 'listening to adult problems', 'keeping the peace between people', 'translating, paperwork, calls', 'money', 'being the one who made them proud'] },
        { id: 'events', type: 'many', q: 'did any of this happen while you were growing up?', opt: true, o: ['divorce or separation', 'money problems', 'a parent who was sick, drinking, or using', 'losing someone', 'moving countries', 'a parent who was there but emotionally absent', 'none of these'] },
      ] },
      { title: 'the pattern today', note: 'how often is this true for you?', questions: [
        { id: 'guilt', type: 'scale', q: 'i feel guilty when i rest.' },
        { id: 'yes', type: 'scale', q: 'i say yes when i mean no.' },
        { id: 'moods', type: 'scale', q: "i feel responsible for other people's moods." },
        { id: 'help', type: 'scale', q: 'asking for help feels impossible.' },
        { id: 'anger', type: 'scale', q: 'my anger comes out, then i feel guilty for it.' },
        { id: 'money', type: 'one', q: 'do you support your family with money?', o: ['no', 'sometimes, and it\'s fine', 'sometimes, and it stresses me', 'regularly, and it stresses me'] },
      ] },
      { title: "where you're stuck", questions: [
        { id: 'where', type: 'one', q: 'where does it hurt most right now?', o: ['my mom or parents', 'my partner', 'my siblings', 'work or my business', 'money', 'friendships', 'me: rest, my body, my time'] },
        { id: 'moment', type: 'text', q: 'tell me about one recent moment it showed up.', hint: 'what happened, who said what, what you felt. 3 to 6 sentences is perfect.' },
        { id: 'react', type: 'text', q: 'what did you do in that moment, and what do you wish you had done?' },
        { id: 'tried', type: 'many', q: 'what have you already tried?', o: ['therapy', 'books or podcasts', 'the workbook', 'talking to them about it', 'putting distance between us', 'nothing yet'] },
      ] },
      { title: 'what you want', questions: [
        { id: 'want', type: 'text', q: 'if this pattern loosened its grip, what would be different 3 months from now?' },
        { id: 'tone', type: 'one', q: 'how direct do you want me to be?', o: ['gentle', 'honest', "don't hold back"] },
        { id: 'else', type: 'text', opt: true, q: 'anything else i should know?' },
      ] },
    ],
  },
  es: {
    intro: 'te toma unos 8 minutos. entre más honesta y específica seas, más exacta va a ser tu lectura. nadie ve esto más que yo.',
    next: 'siguiente', back: 'atrás', send: 'mandar mis respuestas', sending: 'enviando…', optional: 'opcional', required: 'contesta esta para continuar.',
    scale: ['nunca', 'a veces', 'seguido', 'siempre'],
    sections: [
      { title: 'donde empezó', questions: [
        { id: 'place', type: 'one', q: '¿qué lugar ocupas en tu familia?', o: ['la hija mayor', 'hija única', 'no soy la mayor, pero fui la responsable'] },
        { id: 'gap', type: 'one', q: '¿cuántos años le llevas a tu siguiente hermano o hermana?', o: ['menos de 2 años', 'de 2 a 5 años', 'de 6 a 10 años', 'más de 10 años', 'no tengo hermanos'] },
        { id: 'who', type: 'many', q: '¿quién te necesitaba más de niña?', o: ['mi mamá', 'mi papá', 'mis hermanos', 'mis abuelos', 'toda la casa'] },
        { id: 'jobs', type: 'many', q: '¿qué hacías por ellos?', o: ['cocinar, limpiar, quehaceres', 'cuidar a mis hermanos', 'escuchar problemas de adultos', 'mantener la paz entre todos', 'traducir, trámites, llamadas', 'dinero', 'ser la que los hacía sentir orgullosos'] },
        { id: 'events', type: 'many', q: '¿pasó algo de esto mientras crecías?', opt: true, o: ['divorcio o separación', 'problemas de dinero', 'un papá o mamá enfermo, que tomaba o consumía', 'la pérdida de alguien', 'mudarnos de país', 'un papá o mamá presente pero emocionalmente ausente', 'nada de esto'] },
      ] },
      { title: 'el patrón hoy', note: '¿qué tan seguido es cierto para ti?', questions: [
        { id: 'guilt', type: 'scale', q: 'me siento culpable cuando descanso.' },
        { id: 'yes', type: 'scale', q: 'digo que sí cuando quiero decir que no.' },
        { id: 'moods', type: 'scale', q: 'me siento responsable del estado de ánimo de los demás.' },
        { id: 'help', type: 'scale', q: 'pedir ayuda se me hace imposible.' },
        { id: 'anger', type: 'scale', q: 'mi enojo explota y luego me siento culpable.' },
        { id: 'money', type: 'one', q: '¿apoyas a tu familia con dinero?', o: ['no', 'a veces, y está bien', 'a veces, y me estresa', 'seguido, y me estresa'] },
      ] },
      { title: 'dónde estás atorada', questions: [
        { id: 'where', type: 'one', q: '¿dónde te duele más ahorita?', o: ['mi mamá o mis papás', 'mi pareja', 'mis hermanos', 'el trabajo o mi negocio', 'el dinero', 'las amistades', 'yo: descanso, mi cuerpo, mi tiempo'] },
        { id: 'moment', type: 'text', q: 'cuéntame de un momento reciente en que apareció.', hint: 'qué pasó, quién dijo qué, qué sentiste. de 3 a 6 frases es perfecto.' },
        { id: 'react', type: 'text', q: '¿qué hiciste en ese momento, y qué te hubiera gustado hacer?' },
        { id: 'tried', type: 'many', q: '¿qué has intentado ya?', o: ['terapia', 'libros o podcasts', 'el libro', 'hablarlo con ellos', 'poner distancia', 'nada todavía'] },
      ] },
      { title: 'lo que quieres', questions: [
        { id: 'want', type: 'text', q: 'si este patrón te soltara un poco, ¿qué sería diferente dentro de 3 meses?' },
        { id: 'tone', type: 'one', q: '¿qué tan directa quieres que sea contigo?', o: ['suave', 'honesta', 'sin rodeos'] },
        { id: 'else', type: 'text', opt: true, q: '¿algo más que deba saber?' },
      ] },
    ],
  },
};
