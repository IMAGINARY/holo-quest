import { Howl, Howler } from 'howler';
import { logger } from '../helpers/logger';

const VALID_RESOURCE_ID = /^[a-zA-Z][a-zA-Z0-9_-]*$/;

export default class SoundManager {
  /**
   * Creates a new SoundManager instance.
   *
   * @param {object} config The application configuration object. Expected to contain a
   *  `sound` property with `volume` and `resources`.
   */
  constructor(config) {
    const { sound } = config;

    Howler.volume(sound.volume ?? 1);

    this.howls = {};
    this.loadResources(sound.resources);
  }

  /**
   * Loads sound resources, creating a Howl instance for each valid entry. Can be called
   * multiple times to add more resources.
   *
   * @param {object} resources A map of resource IDs to their configuration. Each resource
   *  can have `src`, `loop`, `preload`, and `sprites` properties. IDs must start with a
   *  letter and contain only letters, numbers, hyphens, or underscores.
   */
  loadResources(resources) {
    const entries = Object.entries(resources || {});
    entries.forEach(([id, resource]) => {
      if (!VALID_RESOURCE_ID.test(id)) {
        logger.warn(`SoundManager: invalid resource ID '${id}' (must start with a letter and contain only letters, numbers, hyphens, or underscores)`);
        return;
      }

      const src = Array.isArray(resource.src) ? resource.src : [resource.src];
      const preload = resource.preload === false ? 'metadata' : true;

      const opts = {
        src,
        preload,
      };

      if (resource.loop !== undefined) {
        opts.loop = resource.loop;
      }

      if (preload === 'metadata') {
        opts.html5 = true;
      }

      if (resource.sprites !== undefined) {
        opts.sprite = resource.sprites;
      }

      this.howls[id] = new Howl(opts);
    });
  }

  /**
   * Plays a sound or sprite.
   *
   * @param {string} id The resource ID, optionally followed by a dot and sprite ID
   *  (e.g., `'effects.click'`).
   * @returns {number|undefined} The Howler sound ID, or undefined if the resource was not found.
   */
  play(id) {
    const dotIndex = id.indexOf('.');
    const resourceId = dotIndex === -1 ? id : id.substring(0, dotIndex);
    const spriteId = dotIndex === -1 ? undefined : id.substring(dotIndex + 1);

    const howl = this.howls[resourceId];
    if (!howl) {
      logger.warn(`SoundManager: resource '${resourceId}' not found`);
      return undefined;
    }

    return spriteId ? howl.play(spriteId) : howl.play();
  }

  /**
   * Pauses all instances of a sound resource.
   *
   * @param {string} id The resource ID (sprite suffix is ignored; the entire resource is paused).
   */
  pause(id) {
    const resourceId = id.split('.')[0];
    const howl = this.howls[resourceId];
    if (!howl) {
      logger.warn(`SoundManager: resource '${resourceId}' not found`);
      return;
    }
    howl.pause();
  }

  /**
   * Stops all instances of a sound resource.
   *
   * @param {string} id The resource ID (sprite suffix is ignored; the entire resource is stopped).
   */
  stop(id) {
    const resourceId = id.split('.')[0];
    const howl = this.howls[resourceId];
    if (!howl) {
      logger.warn(`SoundManager: resource '${resourceId}' not found`);
      return;
    }
    howl.stop();
  }

  /**
   * Stops all sounds globally across all Howl instances.
   */
  stopAll() {
    Object.values(this.howls).forEach((howl) => howl.stop());
  }
}
