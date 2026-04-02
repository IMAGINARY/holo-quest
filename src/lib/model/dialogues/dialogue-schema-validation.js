import logger from 'loglevel';
import Ajv from 'ajv';
import schema from '../../../../specs/dialogue.schema.json';

export function validateDialogueDefinition(dialogueDefinition) {
  if (!validateDialogueDefinition.validate) {
    const ajv = new Ajv();
    validateDialogueDefinition.validate = ajv.compile(schema);
  }
  const valid = validateDialogueDefinition.validate(dialogueDefinition);
  if (!valid) {
    logger.error('Error validating dialogue', validateDialogueDefinition.validate.errors);
    throw new Ajv.ValidationError(validateDialogueDefinition.validate.errors);
  }
  return true;
}
