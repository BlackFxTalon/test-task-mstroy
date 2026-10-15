import { describe, expect, it } from 'vitest';
import { watch, nextTick } from 'vue';
import { useTreeStore } from '../src/composables/useTreeStore';

describe('useTreeStore', () => {
  it('starts empty and exposes items reactively', async () => {
    const { items, setItems } = useTreeStore();
    expect(items.value).toEqual([]);

    let calls = 0;
    watch(items, () => calls++);
    setItems([{ id: 1, parent: null }]);
    await nextTick();

    expect(items.value).toEqual([{ id: 1, parent: null }]);
    expect(calls).toBe(1);
  });

  it('reflects add, update and remove', () => {
    const { items, addItem, updateItem, removeItem, setItems } = useTreeStore();
    setItems([{ id: 1, parent: null }]);
    addItem({ id: 2, parent: 1 });
    expect(items.value).toHaveLength(2);
    updateItem({ id: 2, parent: 1, label: 'x' });
    expect(items.value[1]?.label).toBe('x');
    removeItem(1);
    expect(items.value).toEqual([]);
  });
});
