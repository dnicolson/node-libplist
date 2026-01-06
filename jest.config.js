module.exports = {
  preset: 'ts-jest',
  roots: ['<rootDir>/src'],
  testPathIgnorePatterns: ['/dist/', 'src/test.ts'],
  collectCoverageFrom: ['src/**/*.ts', '!src/**/*.d.ts'],
};
