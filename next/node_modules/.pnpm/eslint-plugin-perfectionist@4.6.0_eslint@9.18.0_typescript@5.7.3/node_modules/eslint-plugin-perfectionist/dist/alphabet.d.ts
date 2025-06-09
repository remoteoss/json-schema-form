/**
 * Utility class to build alphabets
 */
export declare class Alphabet {
  private _characters
  private constructor()
  /**
   * Generates an alphabet from the given characters.
   * @param {string|string[]} values - The characters to generate the alphabet from
   * @returns {Alphabet} - The wrapped alphabet
   */
  static generateFrom(values: string[] | string): Alphabet
  /**
   * Generates an alphabet containing relevant characters from the Unicode
   * standard. Contains the Unicode planes 0 and 1.
   * @returns {Alphabet} - The generated alphabet
   */
  static generateRecommendedAlphabet(): Alphabet
  /**
   * Generates an alphabet containing all characters from the Unicode standard
   * except for irrelevant Unicode planes.
   * Contains the Unicode planes 0, 1, 2 and 3.
   * @returns {Alphabet} - The generated alphabet
   */
  static generateCompleteAlphabet(): Alphabet
  private static _convertCodepointToCharacter
  /**
   * Generates an alphabet containing relevant characters from the Unicode
   * standard.
   * @param {number} maxCodePoint - The maximum code point to generate the
   * alphabet to
   * @returns {Alphabet} - The generated alphabet
   */
  private static _generateAlphabetToRange
  /**
   * For each character with a lower and upper case, permutes the two cases
   * so that the alphabet is ordered by the case priority entered.
   * @param {string} casePriority - The case to prioritize
   * @returns {Alphabet} - The same alphabet instance with the cases prioritized
   * @example
   * Alphabet.generateFrom('aAbBcdCD')
   * .prioritizeCase('uppercase') // Returns 'AaBbCDcd'.
   */
  prioritizeCase(casePriority: 'lowercase' | 'uppercase'): this
  /**
   * Adds specific characters to the end of the alphabet.
   * @param {string|string[]} values - The characters to push to the alphabet
   * @returns {Alphabet} - The same alphabet instance without the specified
   * characters
   * @example
   * Alphabet.generateFrom('ab')
   * .pushCharacters('cd')
   * // Returns 'abcd'
   */
  pushCharacters(values: string[] | string): this
  /**
   * Permutes characters with cases so that all characters with the entered case
   * are put before the other characters.
   * @param {string} caseToComeFirst - The case to put before the other
   * characters
   * @returns {Alphabet} - The same alphabet instance with all characters with
   * case before all the characters with the other case
   */
  placeAllWithCaseBeforeAllWithOtherCase(
    caseToComeFirst: 'uppercase' | 'lowercase',
  ): this
  /**
   * Places a specific character right before another character in the alphabet.
   * @param {object} params - The parameters for the operation
   * @param {string} params.characterBefore - The character to come before
   * characterAfter
   * @param {string} params.characterAfter - The target character
   * @returns {Alphabet} - The same alphabet instance with the specific
   * character prioritized
   * @example
   * Alphabet.generateFrom('ab-cd/')
   * .placeCharacterBefore({ characterBefore: '/', characterAfter: '-' })
   * // Returns 'ab/-cd'
   */
  placeCharacterBefore({
    characterBefore,
    characterAfter,
  }: {
    characterBefore: string
    characterAfter: string
  }): this
  /**
   * Places a specific character right after another character in the alphabet.
   * @param {object} params - The parameters for the operation
   * @param {string} params.characterBefore - The target character
   * @param {string} params.characterAfter - The character to come after
   * characterBefore
   * @returns {Alphabet} - The same alphabet instance with the specific
   * character prioritized
   * @example
   * Alphabet.generateFrom('ab-cd/')
   * .placeCharacterAfter({ characterBefore: '/', characterAfter: '-' })
   * // Returns 'abcd/-'
   */
  placeCharacterAfter({
    characterBefore,
    characterAfter,
  }: {
    characterBefore: string
    characterAfter: string
  }): this
  /**
   * Removes specific characters from the alphabet by their range.
   * @param {object} range - The Unicode range to remove characters from
   * @param {number} range.start - The starting Unicode codepoint
   * @param {number} range.end - The ending Unicode codepoint
   * @returns {Alphabet} - The same alphabet instance without the characters
   * from the specified range
   */
  removeUnicodeRange({ start, end }: { start: number; end: number }): this
  /**
   * Sorts the alphabet by the sorting function provided.
   * @param {Function} sortingFunction - The sorting function to use
   * @returns {Alphabet} - The same alphabet instance sorted by the sorting function provided
   */
  sortBy(
    sortingFunction: (characterA: string, characterB: string) => number,
  ): this
  /**
   * Removes specific characters from the alphabet.
   * @param {string|string[]} values - The characters to remove from the
   * alphabet
   * @returns {Alphabet} - The same alphabet instance without the specified
   * characters
   * @example
   * Alphabet.generateFrom('abcd')
   * .removeCharacters('dcc')
   * // Returns 'ab'
   */
  removeCharacters(values: string[] | string): this
  /**
   * Sorts the alphabet by the natural order of the characters using
   * `natural-orderby`.
   * @param {string} locale - The locale to use for sorting
   * @returns {Alphabet} - The same alphabet instance sorted by the natural
   * order of the characters
   */
  sortByNaturalSort(locale?: string): this
  /**
   * Sorts the alphabet by the character code point.
   * @returns {Alphabet} - The same alphabet instance sorted by the character
   * code point
   */
  sortByCharCodeAt(): this
  /**
   * Sorts the alphabet by the locale order of the characters.
   * @param {Intl.LocalesArgument} locales - The locales to use for sorting
   * @returns {Alphabet} - The same alphabet instance sorted by the locale
   * order of the characters
   */
  sortByLocaleCompare(locales?: Intl.LocalesArgument): this
  /**
   * Retrieves the characters from the alphabet.
   * @returns {string} The characters from the alphabet
   */
  getCharacters(): string
  /**
   * Reverses the alphabet.
   * @returns {Alphabet} - The same alphabet instance reversed
   * @example
   * Alphabet.generateFrom('ab')
   * .reverse()
   * // Returns 'ba'
   */
  reverse(): this
  private _placeCharacterBeforeOrAfter
  private _getCharactersWithCase
}

export {}
