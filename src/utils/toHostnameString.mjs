import toResourceString from './toResourceString.mjs'

/**
 * Replace all non-alphanumeric characters with underscores and convert the string to uppercase.
 * @param {string} str - The string to convert.
 * @returns {string} - The converted string.
 */
export default function toHostnameString (str) {
  return toResourceString(str).replace(/_/g, '-')
}
