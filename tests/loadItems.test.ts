import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { loadItems } from '../src/api/loadItems';

describe('loadItems', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ json: () => Promise.resolve([{ id: 1, parent: null }]) }),
    );
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('requests the data only after the artificial delay', async () => {
    const promise = loadItems('/items.json', 2000);

    await vi.advanceTimersByTimeAsync(1999);
    expect(fetch).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1);
    await expect(promise).resolves.toEqual([{ id: 1, parent: null }]);
    expect(fetch).toHaveBeenCalledWith('/items.json');
  });
});
