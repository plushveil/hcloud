/**
 * Replace all non-alphanumeric characters with underscores and convert the string to uppercase.
 * @param {string} str - The string to convert.
 * @returns {string} - The converted string.
 */
export default function toResourceString (str) {
  str = str.toLowerCase().replace(/[^a-zA-Z0-9]/g, '_')
  while (str.startsWith('_')) str = str.slice(1)
  while (str.endsWith('_')) str = str.slice(0, -1)
  return str
}
