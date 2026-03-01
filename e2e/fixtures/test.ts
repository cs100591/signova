import { test as base, expect } from '@playwright/test';

/**
 * Global test configuration and fixtures
 */
export type TestOptions = {
  testUserEmail: string;
  testUserPassword: string;
};

export const test = base.extend<TestOptions>({
  // Define test user credentials (override in CI with environment variables)
  testUserEmail: ['', { option: true }],
  testUserPassword: ['', { option: true }],
});

export { expect };
