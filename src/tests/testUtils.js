export function mockConsole() {
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
}

export function restoreConsoleAndEnsureItWasNotCalled() {
  expect(console.error).not.toHaveBeenCalled();
  console.error.mockRestore();
  expect(console.warn).not.toHaveBeenCalled();
  console.warn.mockRestore();
}
