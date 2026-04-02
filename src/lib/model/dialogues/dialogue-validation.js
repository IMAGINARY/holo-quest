import checkCyclesInDialogue from './dialogue-validation-cycles';

/**
 * Throws if any two nodes in the dialogue share the same id.
 *
 * @param {Dialogue} dialogue
 * @throws {Error}
 */
function checkDuplicateIds(dialogue) {
  const ids = new Set();
  dialogue.nodes.forEach((node) => {
    if (ids.has(node.id)) {
      throw new Error(`Dialogue contains duplicate node id: ${node.id}`);
    }
    ids.add(node.id);
  });
}

/**
 * Throws if any `then` reference in nodes or responses points to a non-existent id.
 *
 * @param {Dialogue} dialogue
 * @throws {Error}
 */
function checkInvalidReferences(dialogue) {
  const validIds = new Set(dialogue.nodes.map((node) => node.id));
  dialogue.nodes.forEach((node) => {
    if (node.then && !validIds.has(node.then)) {
      throw new Error(`Dialogue contains invalid reference: ${node.then} in node ${node.id}:${dialogue.root.id}`);
    }
    if (node.resposes) {
      node.responses.forEach((response) => {
        if (response.then && !validIds.has(response.then)) {
          throw new Error(`Dialogue contains invalid reference: ${response.then} in node ${node.id}:${dialogue.root.id}`);
        }
      });
    }
  });
}

/**
 * Runs all structural validations on a parsed dialogue: duplicate ids,
 * invalid references, and cycles.
 *
 * @param {Dialogue} dialogue
 * @throws {Error}
 */
export default function validateDialogue(dialogue) {
  checkDuplicateIds(dialogue);
  checkInvalidReferences(dialogue);
  checkCyclesInDialogue(dialogue);
}
