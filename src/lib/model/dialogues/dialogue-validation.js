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
 *  - all values in a single response set must be of the same type
 *  - all values within a single response set must be unique
 *
 * The type rule lives here rather than in the schema: expressing it there needs
 * one `anyOf` branch per type, which multiplies with every other set-level rule.
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

    const types = new Set(withValue.map((r) => typeof r.value));
    if (types.size > 1) {
      throw new Error(`Dialogue has responses that mix ${[...types].sort().join(' and ')} values in node ${node.id}:${dialogue.root.id}`);
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
 * Throws if any statement's responses violate placement constraints:
 *  - if any response in a set has a `position`, all must have one
 *  - all positions within a single response set must be unique
 *  - no response may sit at position 0
 *  - positions must be contiguous, apart from the skipped 0
 *
 * `position` places a response on the spinner track; `value` is narrative data
 * and never affects placement.
 *
 * Position 0 is the neutral resting position: `useSpinnerController` refuses to
 * confirm there, so an option placed at 0 could never be selected.
 *
 * Contiguity matters because `GameView` drives the spinner with `step: 1` over
 * the span of the option keys, making every integer in that span a settle point.
 * A gap would therefore be a settleable slot with no response behind it.
 *
 * @param {Dialogue} dialogue
 * @throws {Error}
 */
function checkResponsePositions(dialogue) {
  dialogue.nodes.forEach((node) => {
    if (!node.responses || node.responses.length === 0) return;

    const withPosition = node.responses.filter((r) => r.position !== undefined);
    if (withPosition.length === 0) return;

    if (withPosition.length !== node.responses.length) {
      throw new Error(`Dialogue has responses with inconsistent positions (some set, some not) in node ${node.id}:${dialogue.root.id}`);
    }

    const seen = new Set();
    withPosition.forEach((r) => {
      if (r.position === 0) {
        throw new Error(`Dialogue has a response at position 0, which is the neutral resting position and can never be selected, in node ${node.id}:${dialogue.root.id}`);
      }
      if (seen.has(r.position)) {
        throw new Error(`Dialogue has duplicate response position ${r.position} in node ${node.id}:${dialogue.root.id}`);
      }
      seen.add(r.position);
    });

    const sorted = [...seen].sort((a, b) => a - b);
    for (let i = 1; i < sorted.length; i += 1) {
      const prev = sorted[i - 1];
      const curr = sorted[i];
      // A step of 2 is allowed only across the skipped neutral position.
      const straddlesNeutral = prev === -1 && curr === 1;
      if (curr - prev !== 1 && !straddlesNeutral) {
        throw new Error(`Dialogue has non-contiguous response positions (${sorted.join(', ')}) in node ${node.id}:${dialogue.root.id}`);
      }
    }
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
 * Throws if a node sets `responseControl` or `responsePlaceholder` without any responses.
 *
 * Both only configure the input control shown for a node's responses, so on a node with none
 * they would silently do nothing. The control id itself is not checked here: it is resolved
 * against the registered controls at runtime (see `GameController.validateStory`).
 *
 * @param {Dialogue} dialogue
 * @throws {Error}
 */
function checkResponseControls(dialogue) {
  dialogue.nodes.forEach((node) => {
    ['responseControl', 'responsePlaceholder'].forEach((property) => {
      if (node[property] === undefined) return;
      if (!node.responses || node.responses.length === 0) {
        throw new Error(`Dialogue node ${node.id} has ${property} but no responses in ${dialogue.root.id}`);
      }
    });
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
 * invalid references, response values, response positions, response flags,
 * response controls, capture condition, and cycles.
 *
 * @param {Dialogue} dialogue
 * @throws {Error}
 */
export default function validateDialogue(dialogue) {
  checkDuplicateIds(dialogue);
  checkInvalidReferences(dialogue);
  checkResponseValues(dialogue);
  checkResponsePositions(dialogue);
  checkResponseFlag(dialogue);
  checkResponseControls(dialogue);
  checkCapture(dialogue);
  checkCyclesInDialogue(dialogue);
}
