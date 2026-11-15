// The Eldest Daughter Love Report questionnaire (thank-you page, after the one-click purchase).
// types: one (single choice), many (multi choice), short (one line), text (open answer)
// opt: true = optional. A section with opt: true can be skipped entirely.
// Edit wording here; the page and the email to the inbox both read from this file.
window.AUDIT_QUESTIONS = {
  en: {
    intro: 'about 8 minutes. the more specific you are, the more exact your report will be. nobody sees this but me.',
    next: 'next', back: 'back', send: 'send my answers', sending: 'sending…', optional: 'optional', required: 'answer this one to continue.',
    sections: [
      { title: 'you', questions: [
        { id: 'age', type: 'one', q: 'how old are you?', o: ['18 to 24', '25 to 34', '35 to 44', '45 or older'] },
        { id: 'place', type: 'one', q: 'where are you in your family?', o: ['the eldest daughter', 'an only child', 'not the eldest, but i was the responsible one'] },
        { id: 'sibs', type: 'text', q: 'tell me about your siblings.', hint: 'older or younger, boy or girl, and the age gap with each. for example: "a brother 3 years younger and a sister 7 years younger."' },
        { id: 'loss', type: 'one', q: 'before you were 17, did you lose a parent or sibling?', hint: 'through death, divorce, separation, or a parent leaving.', o: ['no', 'yes'] },
        { id: 'lossd', type: 'short', opt: true, q: 'if yes: who, how, and how old were you?' },
        { id: 'conflict', type: 'one', q: 'growing up, did you have more conflict with a parent than most of your friends did?', o: ['no', 'yes, with my mom', 'yes, with my dad', 'yes, with both'] },
      ] },
      { title: 'your love life', questions: [
        { id: 'status', type: 'one', q: 'where are you right now?', o: ["in a relationship", "interested in someone", "torn between two people", "single"] },
        { id: 'story', type: 'text', q: "what's going on? what keeps repeating?", hint: 'the fights, the feeling, the type you keep ending up with. 3 to 6 sentences is perfect.' },
      ] },
      { title: 'them', opt: true, note: "single? skip this step.", questions: [
        { id: 'p1name', type: 'short', opt: true, q: 'their name or nickname', hint: 'a made-up name is fine. i\'ll use it in your report.' },
        { id: 'p1age', type: 'short', opt: true, q: 'their age (roughly)' },
        { id: 'p1order', type: 'one', opt: true, q: 'their birth order', o: ['firstborn', 'middle child', 'youngest', 'only child', 'twin', 'not sure'] },
        { id: 'p1sibs', type: 'short', opt: true, q: 'their siblings: older or younger, and the age gaps' },
        { id: 'p1loss', type: 'short', opt: true, q: 'did they lose a parent or sibling before 17, or have a lot of conflict with a parent?' },
      ] },
      { title: 'the second person', opt: true, note: 'only if you\'re torn between two people. otherwise, skip.', questions: [
        { id: 'p2name', type: 'short', opt: true, q: 'their name or nickname' },
        { id: 'p2age', type: 'short', opt: true, q: 'their age (roughly)' },
        { id: 'p2order', type: 'one', opt: true, q: 'their birth order', o: ['firstborn', 'middle child', 'youngest', 'only child', 'twin', 'not sure'] },
        { id: 'p2sibs', type: 'short', opt: true, q: 'their siblings: older or younger, and the age gaps' },
        { id: 'p2loss', type: 'short', opt: true, q: 'did they lose a parent or sibling before 17, or have a lot of conflict with a parent?' },
      ] },
      { title: 'last thing', questions: [
        { id: 'ask', type: 'text', q: 'what do you most want to know?' },
        { id: 'tone', type: 'one', q: 'how direct do you want me to be?', o: ['gentle', 'honest', "don't hold back"] },
        { id: 'else', type: 'text', opt: true, q: 'anything else i should know?' },
      ] },
    ],
  },
  es: {
    intro: 'unos 8 minutos. entre más específica seas, más exacto va a ser tu reporte. nadie ve esto más que yo.',
    next: 'siguiente', back: 'atrás', send: 'mandar mis respuestas', sending: 'enviando…', optional: 'opcional', required: 'contesta esta para continuar.',
    sections: [
      { title: 'tú', questions: [
        { id: 'age', type: 'one', q: '¿cuántos años tienes?', o: ['de 18 a 24', 'de 25 a 34', 'de 35 a 44', '45 o más'] },
        { id: 'place', type: 'one', q: '¿qué lugar ocupas en tu familia?', o: ['la hija mayor', 'hija única', 'no soy la mayor, pero fui la responsable'] },
        { id: 'sibs', type: 'text', q: 'cuéntame de tus hermanos.', hint: 'mayores o menores, hombre o mujer, y cuántos años de diferencia con cada uno. por ejemplo: "un hermano 3 años menor y una hermana 7 años menor."' },
        { id: 'loss', type: 'one', q: 'antes de los 17, ¿perdiste a tu papá, tu mamá o a un hermano?', hint: 'por muerte, divorcio, separación o porque se fue.', o: ['no', 'sí'] },
        { id: 'lossd', type: 'short', opt: true, q: 'si sí: ¿a quién, cómo y qué edad tenías?' },
        { id: 'conflict', type: 'one', q: 'de niña, ¿tuviste más conflicto con alguno de tus papás que la mayoría de tus amigas?', o: ['no', 'sí, con mi mamá', 'sí, con mi papá', 'sí, con los dos'] },
      ] },
      { title: 'tu vida amorosa', questions: [
        { id: 'status', type: 'one', q: '¿en qué punto estás ahorita?', o: ['en una relación', 'me interesa alguien', 'dudando entre dos personas', 'soltera'] },
        { id: 'story', type: 'text', q: '¿qué está pasando? ¿qué se repite?', hint: 'las peleas, lo que sientes, el tipo de persona con la que siempre terminas. de 3 a 6 frases es perfecto.' },
      ] },
      { title: 'la otra persona', opt: true, note: '¿soltera? sáltate este paso.', questions: [
        { id: 'p1name', type: 'short', opt: true, q: 'su nombre o apodo', hint: 'puede ser inventado. lo voy a usar en tu reporte.' },
        { id: 'p1age', type: 'short', opt: true, q: 'su edad (aproximada)' },
        { id: 'p1order', type: 'one', opt: true, q: 'su lugar entre sus hermanos', o: ['primogénito', 'de en medio', 'el menor', 'hijo único', 'gemelo', 'no sé'] },
        { id: 'p1sibs', type: 'short', opt: true, q: 'sus hermanos: mayores o menores, y la diferencia de edad' },
        { id: 'p1loss', type: 'short', opt: true, q: '¿perdió a su papá, mamá o un hermano antes de los 17, o tuvo mucho conflicto con alguno de sus papás?' },
      ] },
      { title: 'la segunda persona', opt: true, note: 'solo si estás dudando entre dos personas. si no, sáltate este paso.', questions: [
        { id: 'p2name', type: 'short', opt: true, q: 'su nombre o apodo' },
        { id: 'p2age', type: 'short', opt: true, q: 'su edad (aproximada)' },
        { id: 'p2order', type: 'one', opt: true, q: 'su lugar entre sus hermanos', o: ['primogénito', 'de en medio', 'el menor', 'hijo único', 'gemelo', 'no sé'] },
        { id: 'p2sibs', type: 'short', opt: true, q: 'sus hermanos: mayores o menores, y la diferencia de edad' },
        { id: 'p2loss', type: 'short', opt: true, q: '¿perdió a su papá, mamá o un hermano antes de los 17, o tuvo mucho conflicto con alguno de sus papás?' },
      ] },
      { title: 'por último', questions: [
        { id: 'ask', type: 'text', q: '¿qué es lo que más quieres saber?' },
        { id: 'tone', type: 'one', q: '¿qué tan directa quieres que sea contigo?', o: ['suave', 'honesta', 'sin rodeos'] },
        { id: 'else', type: 'text', opt: true, q: '¿algo más que deba saber?' },
      ] },
    ],
  },
};
