import '../../styles/show-fatal-error.css';

/**
 * Show a fatal error message on the page.
 *
 * The error message is displayed in a modal dialog that covers the entire page.
 *
 * The error message includes the error name and message, and if we're in
 * development mode, it also includes the stack trace.
 *
 * @param {string} text
 * @param {Error} error
 */
export function showFatalError(text, error) {
  const textEl = document.createElement('div');
  textEl.classList.add('fatal-error-text');
  textEl.textContent = text;

  const detailsEl = document.createElement('div');
  detailsEl.classList.add('fatal-error-details');
  detailsEl.textContent = `${error.name}: ${error.message}`;

  const container = document.createElement('div');
  container.classList.add('fatal-error');
  container.appendChild(textEl);
  container.appendChild(detailsEl);

  // If we're in DEV mode, add the stack trace to the error message.
  if (process.env.NODE_ENV === 'development') {
    const stackEl = document.createElement('pre');
    stackEl.classList.add('fatal-error-stack');
    stackEl.textContent = error.stack;
    container.appendChild(stackEl);
  }

  document.body.appendChild(container);
  document.documentElement.classList.add('with-fatal-error');
}

/**
 * Install a global error handler that shows a fatal error message when an uncaught error occurs.
 *
 * This function should be called at the very beginning of the application,
 * before any other code is executed.
 */
export function installFatalErrorHandler() {
  const handleErrorEvent = (event) => {
    if (event.error) {
      showFatalError('Fatal error', event.error);
    } else if (event.reason) {
      showFatalError('Fatal error', new Error(event.reason));
    } else {
      showFatalError('Fatal error', new Error(event.message));
    }
  };

  window.addEventListener('error', handleErrorEvent);
  window.addEventListener('unhandledrejection', handleErrorEvent);
}
