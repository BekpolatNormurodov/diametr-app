import { randomInt } from 'crypto';

/**
 * Numeric secret (SMS login codes, generated panel passwords). Uses the CSPRNG:
 * Math.random output is predictable from earlier outputs.
 */
export function generatePassword({ length = 8 }) {
    let text = "";
    for (let i = 0; i < length; i++) {
      text += randomInt(0, 10).toString();
    }
    return text;
  }

  

  