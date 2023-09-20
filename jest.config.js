module.exports = {
  collectCoverage: true,
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ["**/?(*.)+(spec|test).ts?(x)"],
  transform: {
    "/.*\.ts$/": ["ts-jest"]
  }
};