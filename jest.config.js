module.exports = async () => {
  return {
    verbose: true,
    testEnvironment: 'jsdom',
    testPathIgnorePatterns: ['/next/test'],
  };
};
