export type ItemId = number | string;

export interface TreeItem {
  id: ItemId;
  parent: ItemId | null;
  [key: string]: unknown;
}

/**
 * In-memory tree storage.
 *
 * Items are indexed twice: by id and by parent id, so lookups, child
 * access and mutations never scan the whole item list.
 * Items whose parent is missing from the store are treated as roots.
 */
export class TreeStore<T extends TreeItem = TreeItem> {
  private readonly itemsById = new Map<ItemId, T>();
  private readonly childIds = new Map<ItemId, Set<ItemId>>();
  private cache: T[] | null = null;

  constructor(items: readonly T[] = []) {
    this.setItems(items);
  }

  getAll(): T[] {
    if (this.cache === null) {
      this.cache = Array.from(this.itemsById.values());
    }
    return this.cache;
  }

  getItem(id: ItemId): T | undefined {
    return this.itemsById.get(id);
  }

  getChildren(id: ItemId): T[] {
    const ids = this.childIds.get(id);
    if (ids === undefined) return [];
    const result: T[] = [];
    for (const childId of ids) {
      result.push(this.itemsById.get(childId) as T);
    }
    return result;
  }

  /** All descendants, breadth first (direct children go first). */
  getAllChildren(id: ItemId): T[] {
    const result: T[] = [];
    const queue: ItemId[] = [id];
    for (let i = 0; i < queue.length; i++) {
      const ids = this.childIds.get(queue[i] as ItemId);
      if (ids === undefined) continue;
      for (const childId of ids) {
        result.push(this.itemsById.get(childId) as T);
        queue.push(childId);
      }
    }
    return result;
  }

  /** Chain from the item itself up to the root. */
  getAllParents(id: ItemId): T[] {
    const result: T[] = [];
    const visited = new Set<ItemId>();
    let current = this.itemsById.get(id);
    while (current !== undefined && !visited.has(current.id)) {
      visited.add(current.id);
      result.push(current);
      current = current.parent === null ? undefined : this.itemsById.get(current.parent);
    }
    return result;
  }

  setItems(items: readonly T[]): void {
    this.itemsById.clear();
    this.childIds.clear();
    for (const item of items) {
      this.itemsById.set(item.id, item);
      this.link(item);
    }
    this.cache = null;
  }

  addItem(item: T): void {
    if (this.itemsById.has(item.id)) {
      throw new Error(`Item with id "${String(item.id)}" already exists`);
    }
    this.itemsById.set(item.id, item);
    this.link(item);
    this.cache = null;
  }

  /** Removes the item together with all its descendants. */
  removeItem(id: ItemId): void {
    const item = this.itemsById.get(id);
    if (item === undefined) return;
    this.unlink(item);
    const stack: ItemId[] = [id];
    while (stack.length > 0) {
      const currentId = stack.pop() as ItemId;
      const ids = this.childIds.get(currentId);
      if (ids !== undefined) {
        for (const childId of ids) stack.push(childId);
        this.childIds.delete(currentId);
      }
      this.itemsById.delete(currentId);
    }
    this.cache = null;
  }

  /** Replaces the stored item that has the same id. */
  updateItem(item: T): void {
    const old = this.itemsById.get(item.id);
    if (old === undefined) {
      throw new Error(`Item with id "${String(item.id)}" does not exist`);
    }
    if (old.parent !== item.parent) {
      this.unlink(old);
      this.link(item);
    }
    this.itemsById.set(item.id, item);
    this.cache = null;
  }

  private link(item: T): void {
    if (item.parent === null) return;
    let ids = this.childIds.get(item.parent);
    if (ids === undefined) {
      ids = new Set();
      this.childIds.set(item.parent, ids);
    }
    ids.add(item.id);
  }

  private unlink(item: T): void {
    if (item.parent === null) return;
    const ids = this.childIds.get(item.parent);
    if (ids === undefined) return;
    ids.delete(item.id);
    if (ids.size === 0) this.childIds.delete(item.parent);
  }
}
