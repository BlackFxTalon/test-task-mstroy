import { describe, expect, it } from 'vitest';
import { nextTick, watch } from 'vue';
import { useTreeStore } from '../src/composables/useTreeStore';

describe('useTreeStore', () => {
  it('starts empty', () => {
    expect(useTreeStore().items.value).toEqual([]);
  });

  it('updates items reactively after setItems', async () => {
    const { items, store, setItems } = useTreeStore();
    let calls = 0;
    watch(items, () => calls++);

    setItems([{ id: 1, parent: null }]);
    await nextTick();

    expect(items.value).toEqual([{ id: 1, parent: null }]);
    expect(store.getItem(1)).toBeDefined();
    expect(calls).toBe(1);
  });
});
