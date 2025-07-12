// Mock for @stackframe/stack-shared
export const isNotNull = jest.fn((value) => value !== null && value !== undefined);
export const isNull = jest.fn((value) => value === null || value === undefined); 