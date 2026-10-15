import { shallowRef } from 'vue';
import { TreeStore, type TreeItem } from '../store/TreeStore';

export function useTreeStore() {
  const store = new TreeStore();
  const items = shallowRef<TreeItem[]>(store.getAll());

  const setItems = (next: TreeItem[]) => {
    store.setItems(next);
    items.value = store.getAll();
  };

  return { store, items, setItems };
}
