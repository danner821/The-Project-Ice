/* Project Ice bootstrap hotfix.
 *
 * game.js currently contains an await inside the final-horn timeout callback
 * without marking that callback async. That is a parse-time SyntaxError, so
 * none of game.js can execute. Until game.js is rewritten directly, load the
 * canonical file, apply this one surgical source correction, and evaluate it
 * in the same page context.
 */
(() => {
  const request = new XMLHttpRequest();
  request.open('GET', '/game.js', false);
  request.send(null);

  if (request.status < 200 || request.status >= 300) {
    throw new Error(`Project Ice could not load game.js (${request.status}).`);
  }

  let source = request.responseText;

  const functionMarker = 'async function handleLiveGameCompletion()';
  const functionIndex = source.indexOf(functionMarker);

  if (functionIndex === -1) {
    throw new Error('Project Ice could not find handleLiveGameCompletion().');
  }

  const timeoutMarker = 'window.setTimeout(\n    () => {';
  const timeoutIndex = source.indexOf(timeoutMarker, functionIndex);

  if (timeoutIndex === -1) {
    throw new Error('Project Ice could not find the final-horn timeout callback.');
  }

  source =
    source.slice(0, timeoutIndex) +
    'window.setTimeout(\n    async () => {' +
    source.slice(timeoutIndex + timeoutMarker.length);

  // Keep browser stack traces pointing back to the canonical source file.
  source += '\n//# sourceURL=/game.js';

  // Direct eval keeps the source executing in this bootstrap scope while all
  // registered event handlers retain access to game.js lexical state.
  eval(source);
})();
