const allEnvPlugins = [
  "@babel/plugin-transform-runtime",
  "@babel/plugin-proposal-class-properties",
  "@babel/plugin-proposal-nullish-coalescing-operator",
  "@babel/plugin-proposal-optional-chaining",
  "@babel/plugin-proposal-partial-application",
  "@babel/plugin-proposal-logical-assignment-operators",
  "@babel/plugin-proposal-throw-expressions",
  "@babel/plugin-transform-react-constant-elements"
]

module.exports = {
  presets: [
    [
      '@babel/preset-react',
    ],
    [
      '@babel/preset-env',
    ]
  ],

  env: {
    production: {
      plugins: [
        ...allEnvPlugins
      ]
    },
    test: {
      plugins: [
        ...allEnvPlugins,
        "@babel/plugin-syntax-dynamic-import"
      ]
    }
  }
};