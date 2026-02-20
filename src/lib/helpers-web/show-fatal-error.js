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
  // If we're in DEV mode, add the stack trace to the error message.
  const stack = process.env.NODE_ENV === 'development'
    ? $('<pre></pre>').addClass('fatal-error-stack').html(error.stack) : null;

  $('<div></div>')
    .addClass('fatal-error')
    .append($('<div></div>')
      .addClass('fatal-error-text')
      .html(text))
    .append($('<div></div>')
      .addClass('fatal-error-details')
      .html(`${error.name}: ${error.message}`))
    .append(stack)
    .appendTo('body');
  $('html').addClass('with-fatal-error');
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
