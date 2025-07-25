'use strict'
var __defProp = Object.defineProperty
var __defNormalProp = (obj, key, value) =>
  key in obj
    ? __defProp(obj, key, {
        enumerable: true,
        configurable: true,
        writable: true,
        value,
      })
    : (obj[key] = value)
var __publicField = (obj, key, value) =>
  __defNormalProp(obj, typeof key !== 'symbol' ? key + '' : key, value)
Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' })
const naturalOrderby = require('natural-orderby')
const convertBooleanToSign = require('./convert-boolean-to-sign.js')
class Alphabet {
  constructor(characters) {
    __publicField(this, '_characters', [])
    this._characters = characters
  }
  /**
   * Generates an alphabet from the given characters.
   * @param {string|string[]} values - The characters to generate the alphabet from
   * @returns {Alphabet} - The wrapped alphabet
   */
  static generateFrom(values) {
    let arrayValues = typeof values === 'string' ? [...values] : values
    if (arrayValues.length !== new Set(arrayValues).size) {
      throw new Error('The alphabet must not contain repeated characters')
    }
    if (arrayValues.some(value => value.length !== 1)) {
      throw new Error('The alphabet must contain single characters')
    }
    return new Alphabet(
      arrayValues.map(value =>
        Alphabet._convertCodepointToCharacter(value.codePointAt(0)),
      ),
    )
  }
  /**
   * Generates an alphabet containing relevant characters from the Unicode
   * standard. Contains the Unicode planes 0 and 1.
   * @returns {Alphabet} - The generated alphabet
   */
  static generateRecommendedAlphabet() {
    return Alphabet._generateAlphabetToRange(131071 + 1)
  }
  /**
   * Generates an alphabet containing all characters from the Unicode standard
   * except for irrelevant Unicode planes.
   * Contains the Unicode planes 0, 1, 2 and 3.
   * @returns {Alphabet} - The generated alphabet
   */
  static generateCompleteAlphabet() {
    return Alphabet._generateAlphabetToRange(262143 + 1)
  }
  static _convertCodepointToCharacter(codePoint) {
    let character = String.fromCodePoint(codePoint)
    let lowercaseCharacter = character.toLowerCase()
    let uppercaseCharacter = character.toUpperCase()
    return {
      value: character,
      codePoint,
      ...(lowercaseCharacter === character
        ? null
        : {
            lowercaseCharacterCodePoint: lowercaseCharacter.codePointAt(0),
          }),
      ...(uppercaseCharacter === character
        ? null
        : {
            uppercaseCharacterCodePoint: uppercaseCharacter.codePointAt(0),
          }),
    }
  }
  /**
   * Generates an alphabet containing relevant characters from the Unicode
   * standard.
   * @param {number} maxCodePoint - The maximum code point to generate the
   * alphabet to
   * @returns {Alphabet} - The generated alphabet
   */
  static _generateAlphabetToRange(maxCodePoint) {
    let totalCharacters = Array.from({ length: maxCodePoint }, (_, i) =>
      Alphabet._convertCodepointToCharacter(i),
    )
    return new Alphabet(totalCharacters)
  }
  /**
   * For each character with a lower and upper case, permutes the two cases
   * so that the alphabet is ordered by the case priority entered.
   * @param {string} casePriority - The case to prioritize
   * @returns {Alphabet} - The same alphabet instance with the cases prioritized
   * @example
   * Alphabet.generateFrom('aAbBcdCD')
   * .prioritizeCase('uppercase') // Returns 'AaBbCDcd'.
   */
  prioritizeCase(casePriority) {
    let charactersWithCase = this._getCharactersWithCase()
    let parsedIndexes = /* @__PURE__ */ new Set()
    let indexByCodePoints = this._characters.reduce(
      (indexByCodePoint, character, index) => {
        indexByCodePoint[character.codePoint] = index
        return indexByCodePoint
      },
      {},
    )
    for (let { character, index } of charactersWithCase) {
      if (parsedIndexes.has(index)) {
        continue
      }
      parsedIndexes.add(index)
      let otherCharacterIndex =
        indexByCodePoints[
          character.uppercaseCharacterCodePoint ??
            character.lowercaseCharacterCodePoint
        ]
      if (otherCharacterIndex === void 0) {
        continue
      }
      parsedIndexes.add(otherCharacterIndex)
      let isCharacterUppercase = !character.uppercaseCharacterCodePoint
      if (isCharacterUppercase) {
        if (
          (casePriority === 'uppercase' && index < otherCharacterIndex) ||
          (casePriority === 'lowercase' && index > otherCharacterIndex)
        ) {
          continue
        }
      } else {
        if (
          (casePriority === 'uppercase' && index > otherCharacterIndex) ||
          (casePriority === 'lowercase' && index < otherCharacterIndex)
        ) {
          continue
        }
      }
      this._characters[index] = this._characters[otherCharacterIndex]
      this._characters[otherCharacterIndex] = character
    }
    return this
  }
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
  pushCharacters(values) {
    let arrayValues = typeof values === 'string' ? [...values] : values
    let valuesSet = new Set(arrayValues)
    let valuesAlreadyExisting = this._characters.filter(({ value }) =>
      valuesSet.has(value),
    )
    if (valuesAlreadyExisting.length > 0) {
      throw new Error(
        `The alphabet already contains the characters ${valuesAlreadyExisting
          .slice(0, 5)
          .map(({ value }) => value)
          .join(', ')}`,
      )
    }
    if (arrayValues.some(value => value.length !== 1)) {
      throw new Error('Only single characters may be pushed')
    }
    this._characters.push(
      ...[...valuesSet].map(value =>
        Alphabet._convertCodepointToCharacter(value.codePointAt(0)),
      ),
    )
    return this
  }
  /**
   * Permutes characters with cases so that all characters with the entered case
   * are put before the other characters.
   * @param {string} caseToComeFirst - The case to put before the other
   * characters
   * @returns {Alphabet} - The same alphabet instance with all characters with
   * case before all the characters with the other case
   */
  placeAllWithCaseBeforeAllWithOtherCase(caseToComeFirst) {
    let charactersWithCase = this._getCharactersWithCase()
    let orderedCharacters = [
      ...charactersWithCase.filter(character =>
        caseToComeFirst === 'uppercase'
          ? !character.character.uppercaseCharacterCodePoint
          : character.character.uppercaseCharacterCodePoint,
      ),
      ...charactersWithCase.filter(character =>
        caseToComeFirst === 'uppercase'
          ? character.character.uppercaseCharacterCodePoint
          : !character.character.uppercaseCharacterCodePoint,
      ),
    ]
    for (let [i, element] of charactersWithCase.entries()) {
      this._characters[element.index] = orderedCharacters[i].character
    }
    return this
  }
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
  placeCharacterBefore({ characterBefore, characterAfter }) {
    return this._placeCharacterBeforeOrAfter({
      characterBefore,
      characterAfter,
      type: 'before',
    })
  }
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
  placeCharacterAfter({ characterBefore, characterAfter }) {
    return this._placeCharacterBeforeOrAfter({
      characterBefore,
      characterAfter,
      type: 'after',
    })
  }
  /**
   * Removes specific characters from the alphabet by their range.
   * @param {object} range - The Unicode range to remove characters from
   * @param {number} range.start - The starting Unicode codepoint
   * @param {number} range.end - The ending Unicode codepoint
   * @returns {Alphabet} - The same alphabet instance without the characters
   * from the specified range
   */
  removeUnicodeRange({ start, end }) {
    this._characters = this._characters.filter(
      ({ codePoint }) => codePoint < start || codePoint > end,
    )
    return this
  }
  /**
   * Sorts the alphabet by the sorting function provided.
   * @param {Function} sortingFunction - The sorting function to use
   * @returns {Alphabet} - The same alphabet instance sorted by the sorting function provided
   */
  sortBy(sortingFunction) {
    this._characters.sort((a, b) => sortingFunction(a.value, b.value))
    return this
  }
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
  removeCharacters(values) {
    this._characters = this._characters.filter(
      ({ value }) => !values.includes(value),
    )
    return this
  }
  /**
   * Sorts the alphabet by the natural order of the characters using
   * `natural-orderby`.
   * @param {string} locale - The locale to use for sorting
   * @returns {Alphabet} - The same alphabet instance sorted by the natural
   * order of the characters
   */
  sortByNaturalSort(locale) {
    let naturalCompare = naturalOrderby.compare({
      locale,
    })
    return this.sortBy((a, b) => naturalCompare(a, b))
  }
  /**
   * Sorts the alphabet by the character code point.
   * @returns {Alphabet} - The same alphabet instance sorted by the character
   * code point
   */
  sortByCharCodeAt() {
    return this.sortBy((a, b) =>
      convertBooleanToSign.convertBooleanToSign(
        a.charCodeAt(0) > b.charCodeAt(0),
      ),
    )
  }
  /**
   * Sorts the alphabet by the locale order of the characters.
   * @param {Intl.LocalesArgument} locales - The locales to use for sorting
   * @returns {Alphabet} - The same alphabet instance sorted by the locale
   * order of the characters
   */
  sortByLocaleCompare(locales) {
    return this.sortBy((a, b) => a.localeCompare(b, locales))
  }
  /**
   * Retrieves the characters from the alphabet.
   * @returns {string} The characters from the alphabet
   */
  getCharacters() {
    return this._characters.map(({ value }) => value).join('')
  }
  /**
   * Reverses the alphabet.
   * @returns {Alphabet} - The same alphabet instance reversed
   * @example
   * Alphabet.generateFrom('ab')
   * .reverse()
   * // Returns 'ba'
   */
  reverse() {
    this._characters.reverse()
    return this
  }
  _placeCharacterBeforeOrAfter({ characterBefore, characterAfter, type }) {
    let indexOfCharacterAfter = this._characters.findIndex(
      ({ value }) => value === characterAfter,
    )
    let indexOfCharacterBefore = this._characters.findIndex(
      ({ value }) => value === characterBefore,
    )
    if (indexOfCharacterAfter === -1) {
      throw new Error(`Character ${characterAfter} not found in alphabet`)
    }
    if (indexOfCharacterBefore === -1) {
      throw new Error(`Character ${characterBefore} not found in alphabet`)
    }
    if (indexOfCharacterBefore <= indexOfCharacterAfter) {
      return this
    }
    this._characters.splice(
      type === 'before' ? indexOfCharacterAfter : indexOfCharacterBefore + 1,
      0,
      this._characters[
        type === 'before' ? indexOfCharacterBefore : indexOfCharacterAfter
      ],
    )
    this._characters.splice(
      type === 'before' ? indexOfCharacterBefore + 1 : indexOfCharacterAfter,
      1,
    )
    return this
  }
  _getCharactersWithCase() {
    return this._characters
      .map((character, index) => {
        if (
          !character.uppercaseCharacterCodePoint &&
          !character.lowercaseCharacterCodePoint
        ) {
          return null
        }
        return {
          character,
          index,
        }
      })
      .filter(element => element !== null)
  }
}
exports.Alphabet = Alphabet
