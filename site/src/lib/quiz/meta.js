/* Keys the site keeps among the answers that are not answers: they start
   with "meta.", which no item or salience key does. */
export const CHANGES = 'meta.changes';
export const isMeta = (key) => key.startsWith('meta.');
