module.exports = {
  "parser": "babel-eslint",
  "extends": [
    "standard",
    "standard-react"
  ],
  "plugins": [
    "babel",
    "react",
    "promise"
  ],
  "env": {
    "browser": true
  },
  "globals": {
    "__DEV__": false,
    "__TEST__": false,
    "__PROD__": false,
    "__COVERAGE__": false
  },
  rules: {
    // allow paren-less arrow functions
    "arrow-parens": 0,
    // allow async-await
    "generator-star-spacing": 0,
    // allow debugger during development
    "no-debugger": process.env.NODE_ENV === "production" ? 2 : 0,
    "no-extra-semi": 0,
    semi: 0,
    indent: 0,
    "space-before-function-paren": 0,
    "no-mixed-spaces-and-tabs": 0, //[2, "smart-tabs"], //不允许混用tab和空格
    "eol-last": 0, //文件以换行符结束
    "no-extra-boolean-cast": 0, //不允许出现不必要的布尔值转换
    "spaced-comment": 0, //可以写注释
    "no-tabs": 0, //可以使用tab
    "no-useless-call": 0,
    "operator-linebreak": 0,
    "handle-callback-err": 0,
    "comma-spacing": 0,
    "one-var": 0,
    "padded-blocks": 0,
    "no-multiple-empty-lines": 0,
    "no-trailing-spaces": 1,
    "no-irregular-whitespace": 1,
    "no-throw-literal": 0,
    "prefer-promise-reject-errors": 0,
    "no-unused-vars": ["error", { "varsIgnorePattern": "[connect]" }] // 适配修饰器
  }
}
