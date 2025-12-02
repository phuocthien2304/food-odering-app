module.exports = {
  presets: [
    ['@babel/preset-env', { targets: { node: 'current' } }],
  ],
  plugins: [
    // bắt buộc: hai plugin sau xử lý decorator cho tham số và sinh metadata
    'babel-plugin-transform-typescript-metadata',
    ['@babel/plugin-proposal-decorators', { legacy: true }],
    'babel-plugin-parameter-decorator',
    // giữ nguyên plugin class-properties
    ['@babel/plugin-proposal-class-properties', { loose: true }],
  ],
};
