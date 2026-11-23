import ConditionParser from './condition-parser';
import { logger } from '../../helpers/logger';

/**
 * Iterates through a dialogue tree.
 */
export default class DialogueIterator {
  /**
   * Flag assignment grammar.
   *
   * The flag id is non-greedy (the trailing `?`) so that e.g. "my-flag-=1"
   * parses as flag "my-flag" with operator "-=", rather than flag "my-flag-"
   * with operator "=".
   *
   * A string literal is only accepted after `=`; `+=` and `-=` are
   * numeric-only. Literals admit neither `"` nor `\`, which keeps the
   * backslash free for a future escape syntax.
   */
  static ASSIGNMENT_RE = /^(?<flag>[a-zA-Z_][.a-zA-Z0-9_-]*?)(?:\s*(?:(?<setOp>=)\s*(?:(?<number>-?\d+(?:\.\d+)?)|"(?<string>[^"\\]*)")|(?<incDecOp>[+-]=)\s*(?<amount>-?\d+(?:\.\d+)?)))?$/;

  /**
   * Creates a new iterator for the given dialogue.
   *
   * @param {Dialogue} dialogue
   * @param {DialogueIteratorContext} context
   * @param {string} [startNode] Id of the node to start at. Omit (or pass a
   *  blank value) to start at the dialogue's root node.
   * @throws {Error} if `startNode` is given but names no node in `dialogue`.
   */
  constructor(dialogue, context, startNode) {
    this.dialogue = dialogue;
    this.context = context;
    this.conditionParser = new ConditionParser(context);
    this.reset(startNode);
  }

  /**
   * Resets the iterator to the beginning of the dialogue, or to a specific
   * node when `startNode` is given.
   *
   * @param {string} [startNode] Id of the node to reset to. Omit (or pass a
   *  blank value) to reset to the dialogue's root node.
   * @throws {Error} if `startNode` is given but names no node in the dialogue.
   */
  reset(startNode) {
    if (startNode) {
      const node = this.dialogue.getNode(startNode);
      if (node === undefined) {
        throw new Error(`DialogueIterator: startNode '${startNode}' not found in dialogue '${this.dialogue.root.id}'`);
      }
      this.activeNode = node;
      return;
    }
    this.activeNode = this.dialogue.root;
  }

  /**
   * Returns true if the iterator has reached the end of the dialogue.
   * @returns {boolean}
   */
  isEnd() {
    return this.activeNode === null;
  }

  /**
   * Returns the current active node.
   * @returns {*|null}
   */
  getActiveNode() {
    return this.activeNode;
  }

  /**
   * Returns responses in the current active node that have all their conditions met.
   *
   * @returns {Array|null}
   */
  getEnabledResponses() {
    if (this.activeNode === null) {
      return null;
    }

    if (!this.activeNode.responses) {
      return null;
    }

    return this.activeNode.responses
      .filter((response) => !response.cond || !!this.evaluateCond(response.cond));
  }

  /**
   * Returns the response with the given ID in the active node.
   *
   * @param {string} responseId
   * @returns {Object|null}
   */
  getResponse(responseId) {
    if (this.activeNode === null) {
      return null;
    }

    if (!this.activeNode.responses) {
      return null;
    }

    return this.activeNode.responsesById[responseId];
  }

  /**
   * Advances the iterator to the next node.
   *
   * @throws Error if the active node type is unknown.
   */
  next() {
    if (this.activeNode === null) {
      return;
    }

    const enabledResponses = this.getEnabledResponses();
    if (enabledResponses && enabledResponses.length > 0) {
      throw new Error(`Can't use next() on a node of type 'statement' with responses (${this.activeNode.id}:${this.dialogue.root.id})`);
    }

    this.processAssignments(this.activeNode.set);

    // Collections first try to enter one of their children. Statements and
    // effects have nothing to enter: they are finished as soon as they're left.
    let transitioned = false;
    switch (this.activeNode.type) {
      case 'statement':
      case 'effect':
        break;
      case 'root':
      case 'first':
      case 'sequence':
        // A sequence is entered through its first enabled item, just like a
        // 'first'. They differ in what happens when that item finishes (see
        // continueAfter).
        transitioned = this.nextOnFirst();
        break;
      case 'random':
        transitioned = this.nextOnRandom();
        break;
      case 'cycle':
        transitioned = this.nextOnCycle();
        break;
      default:
        throw new Error(`Unknown node type: ${this.activeNode.type} (${this.activeNode.id}:${this.dialogue.root.id})`);
    }
    if (transitioned === false) {
      transitioned = this.continueAfter(this.activeNode);
    }
    if (transitioned === false) {
      this.activeNode = null;
    }
  }

  /**
   * Advances the iterator by selecting a specific response on the active node.
   *
   * @throws Error if the active node has no responses or the responseId is unknown.
   * @param {string} responseId - The id of the chosen response.
   */
  nextWithResponse(responseId) {
    if (this.activeNode === null) {
      return;
    }

    if (this.activeNode.responses === undefined) {
      throw new Error(`Can't use nextWithResponse on a node without responses (${this.activeNode.type}:${this.dialogue.root.id})`);
    }

    const response = this.activeNode.responsesById[responseId];
    if (!response) {
      throw new Error(`Unknown response id: ${responseId} (${this.activeNode.id}:${this.dialogue.root.id})`);
    }

    this.processAssignments(this.activeNode.set);
    this.processAssignments(response.set);
    if (this.activeNode.responseFlag !== undefined) {
      this.context.flags.set(this.activeNode.responseFlag, response.value);
    }
    if (response.then) {
      this.goTo(response.then);
      return;
    }

    if (!this.continueAfter(this.activeNode)) {
      this.activeNode = null;
    }
  }

  /**
   * Jumps to a node identified by its id.
   *
   * @private
   * @throws Error if the node id is not found.
   * @param {string} nodeId
   */
  goTo(nodeId) {
    const nextNode = this.dialogue.getNode(nodeId);
    if (nextNode === undefined) {
      throw new Error(`Can't find node id: ${nodeId} (active node = ${this.activeNode}:${this.dialogue.root.id})`);
    }
    this.activeNode = nextNode;
  }

  /**
   * Moves the cursor directly to a node without applying any narrative side
   * effects (no `set` processing, no parent traversal, no cycle updates).
   *
   * Intended for developer-mode preview navigation. Do NOT use during
   * narrative playback — it bypasses all flag and cycle bookkeeping.
   *
   * @param {Object|null} node A node from this iterator's dialogue, or null.
   * @throws Error if the node does not belong to this iterator's dialogue.
   */
  jumpTo(node) {
    if (node !== null && this.dialogue.nodesById[node.id] !== node) {
      throw new Error(`jumpTo: node '${node?.id}' is not part of this dialogue (${this.dialogue.root.id})`);
    }
    this.activeNode = node;
  }

  /**
   * Filters items to only those whose conditions are met.
   *
   * @private
   * @param {Array<Object>} items
   * @returns {Array<Object>}
   */
  getEnabledItems(items) {
    if (!items) return [];
    return items.filter((item) => (
      item.cond === undefined || item.cond === null || item.cond.trim() === ''
        || this.evaluateCond(item.cond)
    ));
  }

  /**
   * Evaluates a condition, tagging any failure with the node and dialogue ids.
   *
   * Only throws when the context is strict: in lenient mode the parser logs
   * the problem itself and returns 0, so the node or response is skipped
   * rather than taking the story down.
   *
   * @private
   * @param {string} cond
   * @returns {number}
   */
  evaluateCond(cond) {
    try {
      return this.conditionParser.evaluate(cond);
    } catch (e) {
      throw new Error(`Error parsing condition: ${cond} (${this.activeNode.id}:${this.dialogue.root.id}): ${e.message}`);
    }
  }

  /**
   * Applies the flag assignment expressions of a `set` property (e.g. "myFlag",
   * "score += 1"), which holds either a single expression or an array of them.
   *
   * @private
   * @param {string|Array<string>} [assignments]
   */
  processAssignments(assignments) {
    if (!assignments) return;
    const list = Array.isArray(assignments) ? assignments : [assignments];
    list.forEach((assignment) => {
      this.processAssignment(assignment);
    });
  }

  /**
   * Executes a single flag assignment under the context's strictness policy:
   * a bad assignment throws in strict mode, and is logged and skipped
   * otherwise so that a content mistake can't end the story.
   *
   * @private
   * @param {string} assignment
   */
  processAssignment(assignment) {
    try {
      this.applyAssignment(assignment);
    } catch (e) {
      if (this.conditionParser.strict) {
        throw e;
      }
      logger.error(
        'DialogueIterator: skipping assignment "%s" (%s:%s): %s',
        assignment,
        this.activeNode.id,
        this.dialogue.root.id,
        e.message
      );
    }
  }

  /**
   * Parses and applies a single flag assignment expression.
   *
   * Supported forms: `flag` (touch), `flag = N`, `flag = "text"`, `flag += N`,
   * `flag -= N`. String literals are only valid after `=`.
   *
   * @private
   * @param {string} assignment
   * @throws {Error} if the assignment is malformed.
   * @throws {TypeError} if `+=`/`-=` is applied to a flag holding a string.
   */
  applyAssignment(assignment) {
    const match = assignment.match(DialogueIterator.ASSIGNMENT_RE);
    if (!match) {
      throw new Error(`Invalid assignment: ${assignment} (${this.activeNode.id}:${this.dialogue.root.id})`);
    }
    const {
      flag, setOp, number, string, incDecOp, amount,
    } = match.groups;
    if (setOp === undefined && incDecOp === undefined) {
      this.context.flags.touch(flag);
    } else if (setOp !== undefined) {
      // Tested against undefined rather than for truthiness: `flag = ""` must
      // assign the empty string, not fall through to Number(undefined).
      this.context.flags.set(flag, string !== undefined ? string : Number(number));
    } else if (incDecOp === '+=') {
      this.context.flags.inc(flag, Number(amount));
    } else {
      this.context.flags.dec(flag, Number(amount));
    }
  }

  /**
   * Enters the first enabled item of the active node. Used by 'first',
   * 'sequence' and the root node.
   *
   * @private
   * @returns {boolean} true if an item was entered, false if none is enabled.
   */
  nextOnFirst() {
    const matchingItems = this.getEnabledItems(this.activeNode.items);
    if (matchingItems.length > 0) {
      [this.activeNode] = matchingItems;
      return true;
    }
    return false;
  }

  /**
   * Jumps to the next node when the active node is of type 'random'
   *
   * @private
   * @returns {boolean} true if the transition to the next node was successful.
   */
  nextOnRandom() {
    const matchingItems = this.getEnabledItems(this.activeNode.items);
    if (matchingItems.length > 0) {
      const index = this.context.random(matchingItems.length);
      this.activeNode = matchingItems[index];
      return true;
    }
    return false;
  }

  /**
   * Jumps to the next node when the active node is of type 'cycle'.
   * Picks the first enabled item after the last-visited one, wrapping around.
   *
   * @private
   * @returns {boolean} true if the transition to the next node was successful.
   */
  nextOnCycle() {
    const lastCycleId = this.context.getLastCycleId(this.activeNode.id);
    // Order the items starting with the one right after the last cycle index
    // and then wrapping around to the beginning of the list.
    const { items } = this.activeNode;
    const lastCycleIndex = items.findIndex((item) => item.id === lastCycleId);
    const orderedItems = items.slice(lastCycleIndex + 1).concat(items.slice(0, lastCycleIndex + 1));
    // Now find the first enabled item.
    const matchingItems = this.getEnabledItems(orderedItems);
    if (matchingItems.length > 0) {
      this.context.setLastCycleId(this.activeNode.id, matchingItems[0].id);
      [this.activeNode] = matchingItems;
      return true;
    }
    return false;
  }

  /**
   * Moves on from a node that has finished: a statement or effect that was
   * left, or a collection that had no enabled item to enter.
   *
   * The first of these that applies decides where the dialogue goes:
   *
   * 1. The node's own `then`.
   * 2. If its parent is a sequence, the next enabled sibling after it.
   * 3. Otherwise the parent is finished too, and the same rules apply to it.
   *
   * A parent is never entered again, so a 'first', 'random' or 'cycle' picks
   * only once per visit. A response's `then` takes precedence over all of
   * this, and is handled by nextWithResponse.
   *
   * checkCyclesInDialogue (dialogue-validation-cycles.js) mirrors these rules
   * statically. Keep the two in step.
   *
   * @private
   * @param {Object} node
   * @returns {boolean} true if a next node was found, false if the dialogue
   *  has nowhere left to go.
   */
  continueAfter(node) {
    let current = node;
    while (current) {
      if (current.then) {
        this.goTo(current.then);
        return true;
      }
      const { parent } = current;
      if (parent && parent.type === 'sequence') {
        // Located in the full item list, not the enabled one: the node may
        // have disabled itself while it played (e.g. `cond: ^seen` with
        // `set: seen`), and it still has to be found to know what follows it.
        const index = parent.items.indexOf(current);
        const [nextSibling] = this.getEnabledItems(parent.items.slice(index + 1));
        if (nextSibling) {
          this.activeNode = nextSibling;
          return true;
        }
      }
      current = parent;
    }
    return false;
  }
}
