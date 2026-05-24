export const log = __DEV__
  ? console.log
  : () => {};

export const logError = __DEV__
  ? console.error
  : () => {};
