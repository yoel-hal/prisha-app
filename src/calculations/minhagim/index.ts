import type { Minhag, MinhagStrategy } from '../types';
import { ashkenazMinhag } from './ashkenaz';
import { chabadMinhag } from './chabad';
import { sfaradMinhag } from './sfarad';
import { teimaniMinhag } from './teimani';

/**
 * Registry mapping each minhag name to its strategy implementation.
 * To add a new minhag: create a new strategy file and add it here.
 * To modify a minhag's rules: edit its strategy file directly.
 */
export const minhagRegistry: Record<Minhag, MinhagStrategy> = {
  ashkenaz: ashkenazMinhag,
  sfarad: sfaradMinhag,
  chabad: chabadMinhag,
  teimani: teimaniMinhag,
};
