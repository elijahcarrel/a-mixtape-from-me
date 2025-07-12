// Mock for @stackframe/stack
export const useUser = jest.fn(() => ({
  id: 'test-user-id',
  email: 'test@example.com',
  displayName: 'Test User',
}));

export const UserButton = jest.fn(({ children, ...props }) => {
  return <div data-testid="user-button" {...props}>{children}</div>;
});

export const RequireAuth = jest.fn(({ children }) => {
  return <div data-testid="require-auth">{children}</div>;
}); 