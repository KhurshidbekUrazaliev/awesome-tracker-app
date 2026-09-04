module.exports = {
  root: true,
  extends: ['expo'],
  // server/ is a separate TypeScript project with its own package.json,
  // node_modules, and lint setup — not part of this app's lint scope.
  ignorePatterns: ['server/', 'dist/'],
  settings: {
    'import/resolver': {
      node: {
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
      },
    },
  },
};
