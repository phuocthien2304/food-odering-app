module.exports = {
  presets: ['@babel/preset-env'],
  plugins: [
    ['@babel/plugin-proposal-decorators', { legacy: true }],
    '@babel/plugin-proposal-class-properties',
    'babel-plugin-transform-typescript-metadata',
    'babel-plugin-parameter-decorator'
  ]
};
