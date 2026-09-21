import { describe, it, expect } from 'vitest';
import GameController from '../src/lib/game/game-controller';
import { DEFAULT_UI_CONTROL, validateStoryControls } from '../src/lib/game/ui-controls';
import registerUiControls from '../src/lib/init/register-ui-controls';
import Dialogue from '../src/lib/model/dialogues/dialogue';
import helloWorldDialogue from './fixtures/dialogues/core/hello-world.dialogue.json';
import responseControlDialogue
  from './fixtures/dialogues/responses/response-control.dialogue.json';

// Stand-ins: validation only looks at the identifiers, never at the components.
const rail = () => null;
const drum = () => null;
const registry = () => new Map([['rail', rail], ['drum', drum]]);

/** A story whose statements use the given controls, each with a couple of responses. */
function storyUsing(...controls) {
  return Dialogue.fromJson({
    id: 'controls',
    items: controls.map((responseControl, i) => ({
      id: `pick-${i}`,
      text: 'Pick one',
      responseControl,
      responses: [{ text: 'A' }, { text: 'B' }],
    })),
  });
}

describe('validateStoryControls', () => {
  it('should accept a story whose controls are all registered', () => {
    expect(() => validateStoryControls(Dialogue.fromJson(responseControlDialogue), registry()))
      .to.not.throw();
  });

  it('should accept a story that does not use responseControl at all', () => {
    expect(() => validateStoryControls(Dialogue.fromJson(helloWorldDialogue), registry()))
      .to.not.throw();
  });

  it('should name the node and the control when a control is not registered', () => {
    expect(() => validateStoryControls(storyUsing('drum', 'wheel'), registry()))
      .to.throw("node pick-1 uses 'wheel'");
  });

  it('should list the registered controls to help spot a typo', () => {
    expect(() => validateStoryControls(storyUsing('dram'), registry()))
      .to.throw('(registered: rail, drum)');
  });

  it('should report every offending node, not just the first', () => {
    expect(() => validateStoryControls(storyUsing('wheel', 'drum', 'knob'), registry()))
      .to.throw(/pick-0 uses 'wheel'.*pick-2 uses 'knob'/);
  });

  // Identifiers are looked up in a Map, so names that exist on every plain
  // object must not read as registered controls.
  it('should not treat Object.prototype members as registered controls', () => {
    expect(() => validateStoryControls(storyUsing('constructor'), registry()))
      .to.throw("uses 'constructor'");
  });

  it('should reject a registry without the default control', () => {
    const noDefault = new Map([['drum', drum]]);
    expect(() => validateStoryControls(Dialogue.fromJson(helloWorldDialogue), noDefault))
      .to.throw(`default input control '${DEFAULT_UI_CONTROL}' is not registered`);
  });
});

describe('registerUiControls', () => {
  // The shipped registry has to satisfy the check that guards it.
  it('should register the default control and the drum', () => {
    const uiControls = registerUiControls();
    expect(uiControls.has(DEFAULT_UI_CONTROL)).to.be.true;
    expect(uiControls.has('drum')).to.be.true;
  });

  it('should give a story using the built-in controls a clean bill of health', () => {
    expect(() => validateStoryControls(
      Dialogue.fromJson(responseControlDialogue),
      registerUiControls()
    )).to.not.throw();
  });
});

describe('GameController story validation', () => {
  /** Skips the constructor, which builds the sound manager, stores and keyboard handlers. */
  function makeController() {
    const controller = Object.create(GameController.prototype);
    controller.uiControls = registry();
    return controller;
  }

  it('should throw from validateStory for an unknown control', () => {
    expect(() => makeController().validateStory(storyUsing('wheel')))
      .to.throw("node pick-0 uses 'wheel'");
  });

  it('should store a valid story', () => {
    const controller = makeController();
    const story = storyUsing('drum');
    controller.setStory(story);
    expect(controller.story).to.equal(story);
  });

  it('should refuse an invalid story in setStory and leave it unset', () => {
    const controller = makeController();
    expect(() => controller.setStory(storyUsing('wheel'))).to.throw('Unknown input control');
    expect(controller.story).to.be.undefined;
  });
});
