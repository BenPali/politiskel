/* The model, the questionnaire and the reference data are shared with the
   Node tools (tools/): UMD files that register themselves on globalThis when
   loaded as modules. Imported for that effect, then re-exported. */

import '../../../tools/politi-model.js';
import '../../../tools/politi-quiz.js';

export const PolitiModel = globalThis.PolitiModel;
export const PolitiQuiz = globalThis.PolitiQuiz;
