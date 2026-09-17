import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import yaml from 'js-yaml';
import Dialogue from '../src/lib/model/dialogues/dialogue';

// The shipped story is the one dialogue that schema or validation changes can break
// without any other test noticing: nothing parses it until the kiosk starts up, where
// a failure reaches the player as a fatal error. Loading it here keeps both validation
// layers honest against real content rather than only against fixtures.
// Resolved from the project root: the test environment does not give
// `import.meta.url` a file: scheme, so it cannot be used to locate the file.
const storyPath = resolve(process.cwd(), 'stories/evacuate.yml');

describe('shipped story', () => {
  it('should load and validate stories/evacuate.yml', () => {
    const story = yaml.load(readFileSync(storyPath, 'utf8'));
    expect(() => Dialogue.fromJson(story)).to.not.throw();
  });
});
