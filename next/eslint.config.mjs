import antfu from '@antfu/eslint-config'
import * as tsdoc from 'eslint-plugin-tsdoc'

export default antfu({
  plugins: {
    tsdoc,
  },
})
