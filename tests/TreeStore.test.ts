import { beforeEach, describe, expect, it } from 'vitest';
import { TreeStore, type ITreeItem } from '../src/store/TreeStore';

const makeItems = (): ITreeItem[] => [
  { id: 1, parent: null, label: 'Айтем 1' },
  { id: '91064cef', parent: 1, label: 'Айтем 2' },
  { id: 3, parent: 1, label: 'Айтем 3' },
  { id: 4, parent: '91064cef', label: 'Айтем 4' },
  { id: 5, parent: '91064cef', label: 'Айтем 5' },
  { id: 6, parent: '91064cef', label: 'Айтем 6' },
  { id: 7, parent: 4, label: 'Айтем 7' },
  { id: 8, parent: 4, label: 'Айтем 8' },
];

const ids = (items: ITreeItem[]) => items.map((i) => i.id);

describe('TreeStore', () => {
  let store: TreeStore;

  beforeEach(() => {
    store = new TreeStore(makeItems());
  });

  it('getAll возвращает все элементы', () => {
    expect(store.getAll()).toEqual(makeItems());
  });

  it('работает с пустым хранилищем', () => {
    const empty = new TreeStore();
    expect(empty.getAll()).toEqual([]);
    expect(empty.getItem(1)).toBeUndefined();
    expect(empty.getChildren(1)).toEqual([]);
    expect(empty.getAllChildren(1)).toEqual([]);
    expect(empty.getAllParents(1)).toEqual([]);
  });

  describe('getItem', () => {
    it('возвращает элемент по числовому и строковому id', () => {
      expect(store.getItem(7)).toEqual({ id: 7, parent: 4, label: 'Айтем 7' });
      expect(store.getItem('91064cef')?.label).toBe('Айтем 2');
    });

    it('возвращает undefined для неизвестного id', () => {
      expect(store.getItem(100)).toBeUndefined();
    });

    it('не путает 1 и "1"', () => {
      expect(store.getItem('1')).toBeUndefined();
    });
  });

  describe('getChildren', () => {
    it('возвращает только прямых потомков', () => {
      expect(ids(store.getChildren(1))).toEqual(['91064cef', 3]);
      expect(ids(store.getChildren('91064cef'))).toEqual([4, 5, 6]);
    });

    it('возвращает пустой массив для листа и неизвестного id', () => {
      expect(store.getChildren(7)).toEqual([]);
      expect(store.getChildren(100)).toEqual([]);
    });
  });

  describe('getAllChildren', () => {
    it('возвращает всех потомков', () => {
      expect(ids(store.getAllChildren(1)).sort()).toEqual(
        [3, 4, 5, 6, 7, 8, '91064cef'].sort(),
      );
      expect(ids(store.getAllChildren(4))).toEqual([7, 8]);
    });

    it('сначала перечисляет прямых потомков, затем более глубокие уровни', () => {
      expect(ids(store.getAllChildren(1))).toEqual(['91064cef', 3, 4, 5, 6, 7, 8]);
    });

    it('возвращает пустой массив для листа', () => {
      expect(store.getAllChildren(8)).toEqual([]);
    });
  });

  describe('getAllParents', () => {
    it('возвращает цепочку от элемента до корня', () => {
      expect(ids(store.getAllParents(7))).toEqual([7, 4, '91064cef', 1]);
    });

    it('для корня возвращает только сам элемент', () => {
      expect(ids(store.getAllParents(1))).toEqual([1]);
    });

    it('возвращает пустой массив для неизвестного id', () => {
      expect(store.getAllParents(100)).toEqual([]);
    });

    it('считает корнем элемент с отсутствующим родителем', () => {
      store.addItem({ id: 50, parent: 999 });
      expect(ids(store.getAllParents(50))).toEqual([50]);
    });

    it('не зацикливается на циклической связи', () => {
      const cyclic = new TreeStore([
        { id: 1, parent: 2 },
        { id: 2, parent: 1 },
      ]);
      expect(ids(cyclic.getAllParents(1))).toEqual([1, 2]);
    });
  });

  describe('setItems', () => {
    it('полностью заменяет данные', () => {
      store.setItems([{ id: 10, parent: null }]);
      expect(ids(store.getAll())).toEqual([10]);
      expect(store.getItem(1)).toBeUndefined();
      expect(store.getChildren(1)).toEqual([]);
    });
  });

  describe('addItem', () => {
    it('добавляет элемент и связывает его с родителем', () => {
      store.addItem({ id: 9, parent: 7, label: 'Айтем 9' });
      expect(store.getAll()).toHaveLength(9);
      expect(ids(store.getChildren(7))).toEqual([9]);
      expect(ids(store.getAllParents(9))).toEqual([9, 7, 4, '91064cef', 1]);
    });

    it('выбрасывает ошибку при дублирующемся id', () => {
      expect(() => store.addItem({ id: 1, parent: null })).toThrow();
    });
  });

  describe('removeItem', () => {
    it('удаляет элемент вместе со всеми потомками', () => {
      store.removeItem('91064cef');
      expect(ids(store.getAll())).toEqual([1, 3]);
      expect(ids(store.getChildren(1))).toEqual([3]);
      expect(store.getItem(7)).toBeUndefined();
      expect(store.getChildren(4)).toEqual([]);
    });

    it('ничего не делает для неизвестного id', () => {
      store.removeItem(100);
      expect(store.getAll()).toHaveLength(8);
    });
  });

  describe('updateItem', () => {
    it('обновляет поля элемента', () => {
      store.updateItem({ id: 3, parent: 1, label: 'Новый' });
      expect(store.getItem(3)?.label).toBe('Новый');
      expect(store.getAll()).toHaveLength(8);
    });

    it('переносит элемент при смене родителя', () => {
      store.updateItem({ id: 7, parent: 3, label: 'Айтем 7' });
      expect(ids(store.getChildren(4))).toEqual([8]);
      expect(ids(store.getChildren(3))).toEqual([7]);
      expect(ids(store.getAllParents(7))).toEqual([7, 3, 1]);
    });

    it('выбрасывает ошибку для неизвестного id', () => {
      expect(() => store.updateItem({ id: 100, parent: null })).toThrow();
    });
  });

  describe('кэш getAll', () => {
    it('возвращает один и тот же массив до изменений', () => {
      expect(store.getAll()).toBe(store.getAll());
    });

    it('сбрасывается после add, update, remove и setItems', () => {
      const mutations = [
        () => store.addItem({ id: 9, parent: null }),
        () => store.updateItem({ id: 9, parent: 1 }),
        () => store.removeItem(9),
        () => store.setItems(makeItems()),
      ];
      for (const mutate of mutations) {
        const before = store.getAll();
        mutate();
        expect(store.getAll()).not.toBe(before);
      }
    });

    it('защищён от изменения снаружи', () => {
      expect(() => store.getAll().push({ id: 99, parent: null })).toThrow();
      expect(store.getAll()).toHaveLength(8);
    });
  });

  describe('граничные случаи', () => {
    it('setItems не изменяет входной массив', () => {
      const input = makeItems();
      const snapshot = structuredClone(input);
      new TreeStore(input).addItem({ id: 9, parent: null });
      expect(input).toEqual(snapshot);
    });

    it('удаление корня очищает всё дерево', () => {
      store.removeItem(1);
      expect(store.getAll()).toEqual([]);
    });

    it('элемент с несуществующим родителем считается корнем', () => {
      store.addItem({ id: 9, parent: 'нет такого' });
      expect(ids(store.getAllParents(9))).toEqual([9]);
      expect(ids(store.getAllChildren(1))).not.toContain(9);
    });

    it('updateItem с тем же родителем сохраняет связи и порядок', () => {
      store.updateItem({ id: '91064cef', parent: 1, label: 'Новый' });
      expect(ids(store.getChildren(1))).toEqual(['91064cef', 3]);
      expect(ids(store.getAll())).toEqual([1, '91064cef', 3, 4, 5, 6, 7, 8]);
    });
  });

  it('getAll отражает изменения', () => {
    const before = store.getAll();
    store.addItem({ id: 9, parent: null });
    expect(store.getAll()).not.toBe(before);
    expect(store.getAll()).toHaveLength(9);
  });
});
