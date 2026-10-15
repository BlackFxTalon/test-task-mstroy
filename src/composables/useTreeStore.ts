import { shallowRef } from 'vue';
import { TreeStore, type ITreeItem } from '../store/TreeStore';

export function useTreeStore() {
  const store = new TreeStore();
  const items = shallowRef<ITreeItem[]>(store.getAll());

  const setItems = (next: ITreeItem[]) => {
    store.setItems(next);
    items.value = store.getAll();
  };

  return { store, items, setItems };
}
