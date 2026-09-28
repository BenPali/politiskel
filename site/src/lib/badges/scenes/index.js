/* Every scene, in one module loaded on demand: they weigh some 250 kB, and
   only the pages that show badges need them. Each set file adds its scenes
   to ART or gives one of the first ones its levels. */
import { ART } from './base.js';
import './a.js';
import './b.js';
import './c.js';
import './d.js';
import './e.js';

export { ART };
