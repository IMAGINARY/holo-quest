import findCycle from 'find-cycle/directed';

/**
 * Returns true if the node can be skipped at runtime because of its `cond`.
 *
 * @param {Object} node
 * @returns {boolean}
 */
function isConditional(node) {
  return typeof node.cond === 'string' && node.cond.trim() !== '';
}

/**
 * Returns the ids of the nodes the dialogue may move to when `node` finishes
 * without a response `then` deciding otherwise.
 *
 * This is the static counterpart of `DialogueIterator.continueAfter`, and the
 * two must be kept in step. Conditions can't be evaluated here, so where the
 * runtime picks the next *enabled* sibling in a sequence, this returns every
 * sibling that could turn out to be it: all the following ones up to and
 * including the first that has no `cond`. If none of them is unconditional the
 * sequence may run out, so the search carries on through the parent.
 *
 * @param {Object} node
 * @returns {Array<string>}
 */
function getContinuationTargets(node) {
  const targets = [];
  let current = node;
  while (current) {
    if (current.then) {
      targets.push(current.then);
      return targets;
    }
    const { parent } = current;
    if (parent && parent.type === 'sequence') {
      const laterSiblings = parent.items.slice(parent.items.indexOf(current) + 1);
      const firstCertainIndex = laterSiblings.findIndex((item) => !isConditional(item));
      const candidates = firstCertainIndex === -1
        ? laterSiblings
        : laterSiblings.slice(0, firstCertainIndex + 1);
      targets.push(...candidates.map((item) => item.id));
      if (firstCertainIndex !== -1) {
        return targets;
      }
    }
    current = parent;
  }
  return targets;
}

/**
 * Throws if the dialogue's node graph contains a cycle.
 *
 * Builds a directed graph from response `then` targets, parent-child item
 * links, and the nodes each node may continue to when it finishes (its own
 * `then`, or else whatever follows it through its parents; see
 * {@link getContinuationTargets}), then uses DFS-based cycle detection.
 *
 * The graph errs on the side of rejecting: every node is assumed able to
 * finish without a response `then`, and every condition able to go either way.
 *
 * @param {Dialogue} dialogue
 * @throws {Error} with a description of the cycle path.
 */
export default function checkCyclesInDialogue(dialogue) {
  // Assign a unique id (incremental) to each node in dialogue.nodes
  const ids = {};
  dialogue.nodes.forEach((node, index) => {
    ids[node.id] = index;
  });

  // Create a directed graph from the dialogue
  const graph = new Map();
  dialogue.nodes.forEach((node, index) => {
    const connectedNodes = [];
    if (node.responses !== undefined) {
      node.responses.forEach((response) => {
        if (response.then) {
          connectedNodes.push(response.then);
        }
      });
    }
    if (node.items !== undefined) {
      node.items.forEach((item) => {
        connectedNodes.push(item.id);
      });
    }
    connectedNodes.push(...getContinuationTargets(node));

    graph.set(index, connectedNodes.map((id) => ids[id]));
  });

  // Find cycles in the graph
  const startNodes = new Set([0]);
  const getConnectedNodes = ((index) => graph.get(index));
  const cycle = findCycle(startNodes, getConnectedNodes);
  if (cycle && cycle.length > 0) {
    throw new Error(`Dialogue contains a cycle: ${cycle.map((index) => dialogue.nodes[index].id).join(' -> ')}`);
  }
}
