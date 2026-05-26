// BUILD_ENV=cjs → cjs/（CommonJS）：Chrome 49 + 按需 polyfill，供 require 旧环境使用
// BUILD_ENV=es  → es/（ESM）：仅语法转换，无 polyfill，供现代打包器 import
const cjsConfig = {
  presets: [
    [
      '@babel/preset-env',
      {
        modules: false,
        useBuiltIns: 'usage',
        corejs: 3,
        targets: { browsers: ['Chrome >= 49'] },
      },
    ],
    '@babel/preset-typescript',
  ],
  plugins: [
    '@babel/plugin-transform-class-properties',
    '@babel/plugin-transform-object-rest-spread',
    '@babel/plugin-transform-modules-commonjs',
  ],
};

module.exports = process.env.BUILD_ENV === 'es'
  ? {
    presets: ['@babel/preset-typescript'],
    plugins: [
      '@babel/plugin-transform-class-properties',
      '@babel/plugin-transform-object-rest-spread',
    ],
  }
  : cjsConfig;
