import validateDialogueDefinition from './dialogue-schema-validation';

/**
 * Represents a parsed dialogue tree with nodes linked by parent/child relationships.
 */
export default class Dialogue {
  constructor() {
    /** @type {Object|null} The root node of the dialogue tree. */
    this.root = null;
    /** @type {Array<Object>} Flat list of all nodes in the dialogue. */
    this.nodes = [];
    /** @type {Object<string, Object>} Lookup map of nodes keyed by their id. */
    this.nodesById = {};
  }

  /**
   * Returns the node with the given id, or undefined if not found.
   *
   * @param {string} id
   * @returns {Object|undefined}
   */
  getNode(id) {
    return this.nodesById[id];
  }

  /**
   * Create a Dialogue from a JSON dialogue definition
   *
   * @throws {Ajv.ValidationError}
   * @param {Object} data A JSON dialogue definition (see doc/dialogues.md)
   * @returns {Dialogue}
   */
  static fromJson(data) {
    validateDialogueDefinition(data);
    const newDialogue = new Dialogue();
    newDialogue.root = JSON.parse(JSON.stringify(data));
    newDialogue.root.type = 'root';

    const stack = [newDialogue.root];
    while (stack.length > 0) {
      const node = stack.pop();
      newDialogue.nodes.push(node);
      if (node.items) {
        node.items = node.items.map((item, index) => {
          const normalizedItem = {
            ...item,
            parent: node,
            type: item.type || (item.effect ? 'effect' : 'statement'),
            id: item.id || `${node.id}-${index}`,
          };
          if (normalizedItem.responses) {
            normalizedItem.responses = normalizedItem.responses.map(
              (response, responseIndex) => ({
                ...response,
                parent: normalizedItem,
                id: response.id || `${normalizedItem.id}-${responseIndex}`,
              })
            );
            normalizedItem.responsesById = Object.fromEntries(
              normalizedItem.responses.map((response) => [response.id, response])
            );
          }
          return normalizedItem;
        });
        stack.push(...node.items);
      }
    }

    newDialogue.nodes.forEach((node) => {
      newDialogue.nodesById[node.id] = node;
    });

    return newDialogue;
  }
}
