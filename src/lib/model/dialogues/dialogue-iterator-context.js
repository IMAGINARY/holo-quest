/**
 * Holds runtime state used by {@link DialogueIterator} during traversal,
 * including flag values and cycle tracking.
 */
export default class DialogueIteratorContext {
  /**
   * @param {Object} flags - Flag store providing value/touch/set/inc/dec operations.
   */
  constructor(flags) {
    this.flags = flags;
    /** @type {Object<string, string>} Maps cycle-node ids to the last-visited item id. */
    this.cycleIds = {};
  }

  /**
   * Resets transient traversal state (cycle positions) without clearing flags.
   */
  clearState() {
    this.cycleIds = {};
  }

  /**
   * Returns a random integer in [0, max).
   *
   * @param {number} max - Upper bound (exclusive).
   * @returns {number}
   */
  // eslint-disable-next-line class-methods-use-this
  random(max) {
    return Math.floor(Math.random() * max);
  }

  /**
   * Returns the id of the last item visited in a cycle node, or null if unvisited.
   *
   * @param {string} nodeId - The cycle node's id.
   * @returns {string|null}
   */
  getLastCycleId(nodeId) {
    return this.cycleIds[nodeId] || null;
  }

  /**
   * Records the last-visited item id for a cycle node.
   *
   * @param {string} nodeId - The cycle node's id.
   * @param {string} itemId - The item id that was visited.
   */
  setLastCycleId(nodeId, itemId) {
    this.cycleIds[nodeId] = itemId;
  }
}
