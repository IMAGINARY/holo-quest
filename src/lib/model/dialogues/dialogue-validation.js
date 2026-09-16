import checkCyclesInDialogue from './dialogue-validation-cycles';
import ConditionParser from './condition-parser';
import FlagStore from '../flag-store';

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
    if (node.responses) {
      node.responses.forEach((response) => {
        if (response.then && !validIds.has(response.then)) {
          throw new Error(`Dialogue contains invalid reference: ${response.then} in node ${node.id}:${dialogue.root.id}`);
        }
      });
    }
  });
}

/**
 * Throws if any statement's responses violate value constraints:
 *  - if any response in a set has a `value`, all must have one
 *  - all values within a single response set must be unique
 *
 * @param {Dialogue} dialogue
 * @throws {Error}
 */
function checkResponseValues(dialogue) {
  dialogue.nodes.forEach((node) => {
    if (!node.responses || node.responses.length === 0) return;

    const withValue = node.responses.filter((r) => r.value !== undefined);
    if (withValue.length === 0) return;

    if (withValue.length !== node.responses.length) {
      throw new Error(`Dialogue has responses with inconsistent values (some set, some not) in node ${node.id}:${dialogue.root.id}`);
    }

    const seen = new Set();
    withValue.forEach((r) => {
      if (seen.has(r.value)) {
        throw new Error(`Dialogue has duplicate response value '${r.value}' in node ${node.id}:${dialogue.root.id}`);
      }
      seen.add(r.value);
    });
  });
}

/**
 * Throws if any node has a `responseFlag` without a corresponding set of
 * responses where every response carries a `value`, if a node's response values
 * are not all of the same type, or if two nodes write different types to the
 * same `responseFlag`.
 *
 * Conditions compare the flag, not the response set, so per-node consistency is
 * not enough: two statements sharing a `responseFlag` must agree on the type
 * they write, or `=` silently never matches and ordering throws.
 *
 * @param {Dialogue} dialogue
 * @throws {Error}
 */
function checkResponseFlag(dialogue) {
  const flagTypes = new Map();
  dialogue.nodes.forEach((node) => {
    if (node.responseFlag === undefined) return;

    if (!node.responses || node.responses.length === 0) {
      throw new Error(`Dialogue node ${node.id} has responseFlag but no responses in ${dialogue.root.id}`);
    }

    const missing = node.responses.some((r) => r.value === undefined);
    if (missing) {
      throw new Error(`Dialogue node ${node.id} has responseFlag but responses are missing values in ${dialogue.root.id}`);
    }

    const types = new Set(node.responses.map((r) => typeof r.value));
    if (types.size > 1) {
      throw new Error(`Dialogue node ${node.id} mixes ${[...types].sort().join(' and ')} response values in ${dialogue.root.id}`);
    }

    const [type] = types;
    const seen = flagTypes.get(node.responseFlag);
    if (seen && seen.type !== type) {
      throw new Error(`Dialogue node ${node.id} writes a ${type} to responseFlag '${node.responseFlag}', but node ${seen.nodeId} writes a ${seen.type} in ${dialogue.root.id}`);
    }
    if (!seen) {
      flagTypes.set(node.responseFlag, { type, nodeId: node.id });
    }
  });
}

/**
 * Throws if the dialogue's `capture.cond` is not a parseable condition expression.
 *
 * Evaluated against an empty flag store, so unknown flags resolve to 0: this catches syntax
 * errors and invalid terms, but not a misspelled flag name (an unset flag is a legal term).
 *
 * @param {Dialogue} dialogue
 * @throws {Error}
 */
function checkCapture(dialogue) {
  const { capture } = dialogue.root;
  if (!capture?.cond?.trim()) return;

  try {
    // Always strict: this is a load-time syntax check, so it must report a bad
    // condition rather than quietly evaluating it as false.
    new ConditionParser({ flags: new FlagStore() }, { strict: true }).evaluate(capture.cond);
  } catch (e) {
    throw new Error(`Dialogue has an invalid capture condition: ${capture.cond} in ${dialogue.root.id}: ${e.message}`);
  }
}

/**
 * Runs all structural validations on a parsed dialogue: duplicate ids,
 * invalid references, response values, response flags, capture condition, and cycles.
 *
 * @param {Dialogue} dialogue
 * @throws {Error}
 */
export default function validateDialogue(dialogue) {
  checkDuplicateIds(dialogue);
  checkInvalidReferences(dialogue);
  checkResponseValues(dialogue);
  checkResponseFlag(dialogue);
  checkCapture(dialogue);
  checkCyclesInDialogue(dialogue);
}
