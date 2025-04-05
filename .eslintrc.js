module.exports = {
  parser: '@typescript-eslint/parser',
  extends: [
    'react-app',
    'react-app/jest',
    'plugin:@typescript-eslint/recommended'
  ],
  plugins: ['@typescript-eslint'],
  rules: {
    // Disable specific rules that may be causing problems
    'no-useless-escape': 'off',
    '@typescript-eslint/no-unused-vars': ['error', { 
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_',
      ignoreRestSiblings: true 
    }],
    'react-hooks/exhaustive-deps': 'warn',
    // Reduce TypeScript strictness for deployment
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/ban-ts-comment': 'off'
  }
};
