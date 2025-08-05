// Mock for Next.js navigation
export const useRouter = jest.fn(() => ({
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  refresh: jest.fn(),
  prefetch: jest.fn(),
}));

export const useSearchParams = jest.fn(() => ({
  get: jest.fn((key) => null),
  has: jest.fn((key) => false),
  getAll: jest.fn((key) => []),
  forEach: jest.fn(),
  entries: jest.fn(() => []),
  keys: jest.fn(() => []),
  values: jest.fn(() => []),
  toString: jest.fn(() => ''),
}));

export const usePathname = jest.fn(() => '/');

export const useParams = jest.fn(() => ({}));

export const redirect = jest.fn(); 