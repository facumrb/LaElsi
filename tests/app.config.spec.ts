import { describe, it, expect } from 'vitest';
import { appConfig, queryClient } from '../fe/src/app/app.config';

describe('Application Configuration & QueryClient Setup (app.config.ts)', () => {
  it('should instantiate queryClient with required enterprise defaults', () => {
    expect(queryClient).toBeDefined();
    const defaultOptions = queryClient.getDefaultOptions().queries;

    // Verify 3 minutes staleTime for remote data
    expect(defaultOptions?.staleTime).toBe(1000 * 60 * 3);

    // Verify 15 minutes garbage collection threshold
    expect(defaultOptions?.gcTime).toBe(1000 * 60 * 15);

    // Verify refetch on window focus is active for background revalidation
    expect(defaultOptions?.refetchOnWindowFocus).toBe(true);

    // Verify retry count
    expect(defaultOptions?.retry).toBe(1);
  });

  it('should include required application providers', () => {
    expect(appConfig.providers).toBeDefined();
    expect(Array.isArray(appConfig.providers)).toBe(true);
  });
});
