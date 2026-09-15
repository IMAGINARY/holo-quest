import logger from 'loglevel';
import Dialogue from './dialogue';

/**
 * Returns a minimal placeholder dialogue with a single "..." statement.
 *
 * @param {string} id
 * @returns {Dialogue}
 */
function emptyDialogue(id) {
  return Dialogue.fromJson({
    id,
    items: [{
      text: '...',
    }],
  });
}

/**
 * Builds a {@link Dialogue} from a dialogue definition, falling back to a placeholder on error.
 * Validation and parse errors are logged rather than thrown.
 *
 * The whole definition is passed to {@link Dialogue.fromJson}, so root-level properties such as
 * `capture` are validated and kept. Any validation error (including one in `capture`) replaces
 * the entire dialogue with the placeholder.
 *
 * @param {Object} definition - Dialogue definition (`id`, `items` and optional root-level
 *  properties, see docs/dialogues.md).
 * @returns {Dialogue}
 */
export default function safeBuildDialogue(definition) {
  const { id, items } = definition;
  try {
    if (items.length === 0) {
      logger.error(`Dialogue with id ${id} has no items`);
      return emptyDialogue(id);
    }
    return Dialogue.fromJson(definition);
  } catch (e) {
    if (e.errors) {
      const errorText = [];
      errorText.push(`Error parsing dialogue with id ${id}:`);
      e.errors.forEach((error) => {
        errorText.push(`- ${error.instancePath} : ${error.message}`);
      });
      logger.error(errorText.join('\n'));
    }
    return emptyDialogue(id);
  }
}
