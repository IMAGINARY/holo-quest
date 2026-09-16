import logger from 'loglevel';
import Ajv from 'ajv';
import schema from '../../../../specs/dialogue.schema.json';

/**
 * Validates a raw dialogue JSON definition against the dialogue JSON schema.
 * Lazily compiles the schema on first call.
 *
 * @param {Object} dialogueDefinition - Raw JSON dialogue data.
 * @returns {true} if valid.
 * @throws {Ajv.ValidationError} if validation fails.
 */
export default function validateDialogueDefinition(dialogueDefinition) {
  if (!validateDialogueDefinition.validate) {
    // allErrors so a content mistake reports its real cause: because `node` is a
    // `oneOf`, the first error is otherwise always the unrelated `sequence` branch
    // complaining about a missing `items`.
    const ajv = new Ajv({ allErrors: true });
    validateDialogueDefinition.validate = ajv.compile(schema);
  }
  const valid = validateDialogueDefinition.validate(dialogueDefinition);
  if (!valid) {
    logger.error('Error validating dialogue', validateDialogueDefinition.validate.errors);
    throw new Ajv.ValidationError(validateDialogueDefinition.validate.errors);
  }
  return true;
}
