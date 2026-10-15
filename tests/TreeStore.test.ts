import { beforeEach, describe, expect, it } from 'vitest';
import { TreeStore, type TreeItem } from '../src/store/TreeStore';

const makeItems = (): TreeItem[] => [
  { id: 1, parent: null, label: 'Айтем 1' },
  { id: '91064cef', parent: 1, label: 'Айтем 2' },
  { id: 3, parent: 1, label: 'Айтем 3' },
  { id: 4, parent: '91064cef', label: 'Айтем 4' },
  { id: 5, parent: '91064cef', label: 'Айтем 5' },
  { id: 6, parent: '91064cef', label: 'Айтем 6' },
  { id: 7, parent: 4, label: 'Айтем 7' },
  { id: 8, parent: 4, label: 'Айтем 8' },
];

const ids = (items: TreeItem[]) => items.map((i) => i.id);

describe('TreeStore', () => {
  let store: TreeStore;

  beforeEach(() => {
    store = new TreeStore(makeItems());
  });

  it('getAll returns all items', () => {
    expect(store.getAll()).toEqual(makeItems());
  });

  it('works with an empty store', () => {
    const empty = new TreeStore();
    expect(empty.getAll()).toEqual([]);
    expect(empty.getItem(1)).toBeUndefined();
    expect(empty.getChildren(1)).toEqual([]);
    expect(empty.getAllChildren(1)).toEqual([]);
    expect(empty.getAllParents(1)).toEqual([]);
  });

  describe('getItem', () => {
    it('returns the item by numeric and string id', () => {
      expect(store.getItem(7)).toEqual({ id: 7, parent: 4, label: 'Айтем 7' });
      expect(store.getItem('91064cef')?.label).toBe('Айтем 2');
    });

    it('returns undefined for unknown id', () => {
      expect(store.getItem(100)).toBeUndefined();
    });

    it('does not mix up 1 and "1"', () => {
      expect(store.getItem('1')).toBeUndefined();
    });
  });

  describe('getChildren', () => {
    it('returns direct children only', () => {
      expect(ids(store.getChildren(1))).toEqual(['91064cef', 3]);
      expect(ids(store.getChildren('91064cef'))).toEqual([4, 5, 6]);
    });

    it('returns an empty array for a leaf and for unknown id', () => {
      expect(store.getChildren(7)).toEqual([]);
      expect(store.getChildren(100)).toEqual([]);
    });
  });

  describe('getAllChildren', () => {
    it('returns all descendants', () => {
      expect(ids(store.getAllChildren(1)).sort()).toEqual(
        [3, 4, 5, 6, 7, 8, '91064cef'].sort(),
      );
      expect(ids(store.getAllChildren(4))).toEqual([7, 8]);
    });

    it('lists direct children before deeper levels', () => {
      expect(ids(store.getAllChildren(1))).toEqual(['91064cef', 3, 4, 5, 6, 7, 8]);
    });

    it('returns an empty array for a leaf', () => {
      expect(store.getAllChildren(8)).toEqual([]);
    });
  });

  describe('getAllParents', () => {
    it('returns the chain from the item up to the root', () => {
      expect(ids(store.getAllParents(7))).toEqual([7, 4, '91064cef', 1]);
    });

    it('returns only the item for a root', () => {
      expect(ids(store.getAllParents(1))).toEqual([1]);
    });

    it('returns an empty array for unknown id', () => {
      expect(store.getAllParents(100)).toEqual([]);
    });

    it('treats an item with a missing parent as a root', () => {
      store.addItem({ id: 50, parent: 999 });
      expect(ids(store.getAllParents(50))).toEqual([50]);
    });

    it('does not loop forever on a cycle', () => {
      const cyclic = new TreeStore([
        { id: 1, parent: 2 },
        { id: 2, parent: 1 },
      ]);
      expect(ids(cyclic.getAllParents(1))).toEqual([1, 2]);
    });
  });

  describe('setItems', () => {
    it('fully replaces the data', () => {
      store.setItems([{ id: 10, parent: null }]);
      expect(ids(store.getAll())).toEqual([10]);
      expect(store.getItem(1)).toBeUndefined();
      expect(store.getChildren(1)).toEqual([]);
    });
  });

  describe('addItem', () => {
    it('adds an item and links it to its parent', () => {
      store.addItem({ id: 9, parent: 7, label: 'Айтем 9' });
      expect(store.getAll()).toHaveLength(9);
      expect(ids(store.getChildren(7))).toEqual([9]);
      expect(ids(store.getAllParents(9))).toEqual([9, 7, 4, '91064cef', 1]);
    });

    it('throws on duplicate id', () => {
      expect(() => store.addItem({ id: 1, parent: null })).toThrow();
    });
  });

  describe('removeItem', () => {
    it('removes the item with all descendants', () => {
      store.removeItem('91064cef');
      expect(ids(store.getAll())).toEqual([1, 3]);
      expect(ids(store.getChildren(1))).toEqual([3]);
      expect(store.getItem(7)).toBeUndefined();
      expect(store.getChildren(4)).toEqual([]);
    });

    it('does nothing for unknown id', () => {
      store.removeItem(100);
      expect(store.getAll()).toHaveLength(8);
    });
  });

  describe('updateItem', () => {
    it('updates fields of the item', () => {
      store.updateItem({ id: 3, parent: 1, label: 'Новый' });
      expect(store.getItem(3)?.label).toBe('Новый');
      expect(store.getAll()).toHaveLength(8);
    });

    it('moves the item when parent changes', () => {
      store.updateItem({ id: 7, parent: 3, label: 'Айтем 7' });
      expect(ids(store.getChildren(4))).toEqual([8]);
      expect(ids(store.getChildren(3))).toEqual([7]);
      expect(ids(store.getAllParents(7))).toEqual([7, 3, 1]);
    });

    it('throws for unknown id', () => {
      expect(() => store.updateItem({ id: 100, parent: null })).toThrow();
    });
  });

  it('getAll reflects mutations', () => {
    const before = store.getAll();
    store.addItem({ id: 9, parent: null });
    expect(store.getAll()).not.toBe(before);
    expect(store.getAll()).toHaveLength(9);
  });
});
