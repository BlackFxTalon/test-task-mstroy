import { shallowRef, type ShallowRef } from 'vue';
import { TreeStore, type ItemId, type TreeItem } from '../store/TreeStore';

export interface ReactiveTreeStore {
  store: TreeStore;
  /** Current items; replaced on every mutation so Vue can track changes. */
  items: ShallowRef<TreeItem[]>;
  setItems(items: TreeItem[]): void;
  addItem(item: TreeItem): void;
  removeItem(id: ItemId): void;
  updateItem(item: TreeItem): void;
}

/** Wraps a TreeStore so that Vue reacts to its changes. */
export function useTreeStore(initial: TreeItem[] = []): ReactiveTreeStore {
  const store = new TreeStore(initial);
  const items = shallowRef<TreeItem[]>(store.getAll());
  const sync = () => {
    items.value = store.getAll();
  };

  return {
    store,
    items,
    setItems: (next) => (store.setItems(next), sync()),
    addItem: (item) => (store.addItem(item), sync()),
    removeItem: (id) => (store.removeItem(id), sync()),
    updateItem: (item) => (store.updateItem(item), sync()),
  };
}
