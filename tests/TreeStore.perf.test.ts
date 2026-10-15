import { describe, expect, it } from 'vitest';
import { TreeStore, type ITreeItem } from '../src/store/TreeStore';

const N = 200_000;

function generate(count: number): ITreeItem[] {
  const items: ITreeItem[] = [];
  let seed = 42;
  const rnd = () => (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296;
  for (let i = 0; i < count; i++) {
    const id = i % 2 === 0 ? i : `id-${i}`;
    const parent = i === 0 ? null : items[Math.floor(rnd() * i)]!.id;
    items.push({ id, parent, label: `Item ${i}` });
  }
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [items[i], items[j]] = [items[j]!, items[i]!];
  }
  return items;
}

function measure(name: string, fn: () => void): number {
  const start = performance.now();
  fn();
  const ms = performance.now() - start;
  console.log(`${name}: ${ms.toFixed(2)} ms`);
  return ms;
}

describe(`TreeStore performance (${N} items)`, () => {
  const items = generate(N);
  const store = new TreeStore(items);
  const sampleIds = items.slice(0, 1000).map((i) => i.id);

  it('builds the store quickly', () => {
    expect(measure('constructor', () => new TreeStore(items))).toBeLessThan(1000);
  });

  it('getAll is O(1) after the first call', () => {
    store.getAll();
    expect(measure('getAll (cached)', () => store.getAll())).toBeLessThan(5);
  });

  it('getItem / getChildren stay fast', () => {
    expect(
      measure('getItem x1000', () => sampleIds.forEach((id) => store.getItem(id))),
    ).toBeLessThan(50);
    expect(
      measure('getChildren x1000', () => sampleIds.forEach((id) => store.getChildren(id))),
    ).toBeLessThan(100);
  });

  it('getAllParents x1000', () => {
    expect(
      measure('getAllParents x1000', () => sampleIds.forEach((id) => store.getAllParents(id))),
    ).toBeLessThan(500);
  });

  it('getAllChildren of the root visits every node once', () => {
    const root = items.find((i) => i.parent === null)!;
    let size = 0;
    expect(
      measure('getAllChildren(root)', () => {
        size = store.getAllChildren(root.id).length;
      }),
    ).toBeLessThan(500);
    expect(size).toBe(N - 1);
  });

  it('add / update / remove x1000', () => {
    const local = new TreeStore(items);
    const root = items.find((i) => i.parent === null)!;
    expect(
      measure('addItem x1000', () => {
        for (let i = 0; i < 1000; i++) local.addItem({ id: `new-${i}`, parent: root.id });
      }),
    ).toBeLessThan(100);
    expect(
      measure('updateItem x1000', () => {
        for (let i = 0; i < 1000; i++) local.updateItem({ id: `new-${i}`, parent: null, x: i });
      }),
    ).toBeLessThan(100);
    expect(
      measure('removeItem x1000', () => {
        for (let i = 0; i < 1000; i++) local.removeItem(`new-${i}`);
      }),
    ).toBeLessThan(100);
    expect(local.getAll()).toHaveLength(N);
  });
});
