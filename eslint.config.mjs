import standard from 'neostandard'
import mocha from 'eslint-plugin-mocha'
import jsdoc from 'eslint-plugin-jsdoc'

export default [
  ...standard({}),
  mocha.configs.flat.recommended,
  jsdoc.configs['flat/recommended'],
  {
    files: ['src/hcloud.mjs', 'src/prepare.mjs', 'src/apply.mjs', 'src/orchestrate.mjs'],
    rules: {
      'jsdoc/no-defaults': 'off',
    }
  }
]
