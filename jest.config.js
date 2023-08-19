module.exports = {
  collectCoverage: true,
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ["**/?(*.)+(spec|test).[jt]s?(x)"],
  transform: {
    "/.*\.ts$/": ["ts-jest"]
  }
};