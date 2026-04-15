/**
 * Copyright (c) 2023 by Drew Conley (https://codepen.io/punkydrewster713/pen/zYKdywP)
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software
 * and associated documentation files (the "Software"), to deal in the Software without restriction,
 * including without limitation the rights to use, copy, modify, merge, publish, distribute,
 * sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or
 * substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
 * BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
 * DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 *
 * Modified by Eric Londaits for IMAGINARY gGmbH.
 * Copyright (c) 2023 IMAGINARY gGmbH
 *
 * Migrated from jQuery class to React component for the holo-quest project.
 */

/**
 * Design note: This component uses ref-based DOM manipulation (toggling CSS classes
 * directly on span elements) rather than declarative React state for the character
 * reveal loop. This avoids re-rendering the entire component ~16 times per second
 * during text reveal. The pattern is intentional — preserve it if refactoring.
 */

import {
  forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef,
} from 'react';

/**
 * Speed presets for character reveal delay (in milliseconds).
 */
export const Speeds = Object.freeze({
  pause: 500,
  slow: 120,
  normal: 60,
  fast: 40,
  superFast: 10,
});

const isSpaceRegex = /\s/;

/**
 * Parse segments into a flat array of character descriptors.
 *
 * @param {Array} segments - Array of segment objects with the following properties:
 *   - string {string} Text to display
 *   - speed {number} [optional] Reveal delay in ms (default: Speeds.normal)
 *   - preClasses {string[]} [optional] Classes applied to the span immediately
 *   - classes {string[]} [optional] Classes added when the character is revealed
 *   - noSplit {boolean} [optional] If true, the entire string is treated as one character
 *   - pause {boolean} [optional] If true, spaces are not skipped (they get a delay)
 * @returns {Array} Flat array of character descriptors
 */
function parseSegments(segments) {
  const characters = [];

  segments.forEach((segment, index) => {
    const addChar = (character) => {
      if (character === '\n') {
        characters.push({ character, isBreak: true });
      } else {
        characters.push({
          character,
          preClasses: segment.preClasses || [],
          classes: segment.classes || [],
          isSpace: isSpaceRegex.test(character) && !segment.pause,
          delayAfter: segment.speed || Speeds.normal,
          pause: segment.pause || false,
        });
      }
    };

    if (segment.noSplit) {
      addChar(segment.string);
    } else {
      let { string } = segment;
      if (index < segments.length - 1) {
        string += ' ';
      }
      string.split('').forEach(addChar);
    }
  });

  return characters;
}

/**
 * Progressively reveals text character-by-character, simulating speech in video games.
 *
 * Exposes imperative controls via ref: `revealAll()`, `speedUp()`, `stop()`, `resume()`.
 *
 * @param {Object} props
 * @param {Array} props.segments - Text segments to reveal (see parseSegments for format)
 * @param {function} [props.onComplete] - Called when all characters have been revealed
 * @param {string} [props.className] - Additional CSS class(es) for the container
 * @param {React.Ref} ref - Ref for imperative control
 */
const SpeechText = forwardRef(({ segments, onComplete, className }, ref) => {
  const spanRefs = useRef([]);
  const timeoutRef = useRef(null);
  const speedFactorRef = useRef(1);
  const revealIndexRef = useRef(0);
  const onCompleteRef = useRef(onComplete);

  // Keep onComplete ref current without re-running effects
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const characters = useMemo(() => parseSegments(segments), [segments]);

  const clearRevealTimeout = useCallback(() => {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
  }, []);

  const revealCharacter = useCallback((index) => {
    const span = spanRefs.current[index];
    const char = characters[index];
    if (span && char && !char.isBreak) {
      span.classList.add('revealed');
      char.classes.forEach((c) => span.classList.add(c));
    }
  }, [characters]);

  const handleComplete = useCallback(() => {
    onCompleteRef.current?.();
  }, []);

  const timedReveal = useCallback((index) => {
    if (index >= characters.length) {
      handleComplete();
      return;
    }

    revealCharacter(index);
    revealIndexRef.current = index + 1;
    const char = characters[index];

    if (index < characters.length - 1) {
      const delay = char.isBreak || (char.isSpace && !char.pause) ? 0 : char.delayAfter;
      timeoutRef.current = setTimeout(() => {
        timedReveal(index + 1);
      }, delay * speedFactorRef.current);
    } else {
      handleComplete();
    }
  }, [characters, revealCharacter, handleComplete]);

  const stop = useCallback(() => {
    clearRevealTimeout();
    speedFactorRef.current = 1;
  }, [clearRevealTimeout]);

  const resume = useCallback(() => {
    clearRevealTimeout();
    timeoutRef.current = setTimeout(() => {
      timedReveal(revealIndexRef.current);
    }, 600);
  }, [clearRevealTimeout, timedReveal]);

  const revealAll = useCallback(() => {
    stop();
    for (let i = revealIndexRef.current; i < characters.length; i += 1) {
      revealCharacter(i);
    }
    revealIndexRef.current = characters.length;
    handleComplete();
  }, [stop, characters, revealCharacter, handleComplete]);

  const speedUp = useCallback(() => {
    speedFactorRef.current = 0.2;
  }, []);

  useImperativeHandle(ref, () => ({
    revealAll,
    speedUp,
    stop,
    resume,
  }), [revealAll, speedUp, stop, resume]);

  // Start reveal when segments change
  useEffect(() => {
    revealIndexRef.current = 0;
    speedFactorRef.current = 1;
    resume();
    return clearRevealTimeout;
  }, [characters, resume, clearRevealTimeout]);

  return (
    <div className={className ? `speech-text ${className}` : 'speech-text'}>
      {characters.map((char, i) => {
        if (char.isBreak) {
          // eslint-disable-next-line react/no-array-index-key
          return <div key={i} className="break" />;
        }
        return (
          <span
            // eslint-disable-next-line react/no-array-index-key
            key={i}
            ref={(el) => { spanRefs.current[i] = el; }}
            className={char.preClasses.length > 0 ? char.preClasses.join(' ') : undefined}
          >
            {char.character}
          </span>
        );
      })}
    </div>
  );
});

export default SpeechText;
