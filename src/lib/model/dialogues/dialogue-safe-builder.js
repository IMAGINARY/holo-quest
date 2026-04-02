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
 * Builds a {@link Dialogue} from items, falling back to a placeholder on error.
 * Validation and parse errors are logged rather than thrown.
 *
 * @param {string} id - Dialogue identifier.
 * @param {Array<Object>} items - Dialogue item definitions.
 * @returns {Dialogue}
 */
export default function safeBuildDialogueFromItems(id, items) {
  try {
    if (items.length === 0) {
      logger.error(`Dialogue with id ${id} has no items`);
      return emptyDialogue(id);
    }
    return Dialogue.fromJson({
      id,
      items,
    });
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
