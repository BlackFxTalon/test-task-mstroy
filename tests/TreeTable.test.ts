import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import { defineComponent } from 'vue';
import TreeTable from '../src/components/TreeTable.vue';

vi.mock('../src/grid/setup', () => ({}));

const AgGridStub = defineComponent({
  name: 'AgGridVue',
  props: ['rowData', 'loading', 'columnDefs', 'getDataPath'],
  template: '<div class="grid-stub" />',
});

const items = [
  { id: 1, parent: null, label: 'Айтем 1' },
  { id: 2, parent: 1, label: 'Айтем 2' },
  { id: 3, parent: 2, label: 'Айтем 3' },
];

describe('TreeTable', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ json: () => Promise.resolve(items) }));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  const mountTable = () => mount(TreeTable, { global: { stubs: { AgGridVue: AgGridStub } } });
  const grid = (wrapper: ReturnType<typeof mountTable>) => wrapper.findComponent(AgGridStub);

  it('показывает состояние загрузки без строк, пока не придут данные', () => {
    const wrapper = mountTable();
    expect(grid(wrapper).props('loading')).toBe(true);
    expect(grid(wrapper).props('rowData')).toEqual([]);
  });

  it('заполняет таблицу после задержки в 2 секунды', async () => {
    const wrapper = mountTable();

    await vi.advanceTimersByTimeAsync(1999);
    expect(grid(wrapper).props('loading')).toBe(true);

    await vi.advanceTimersByTimeAsync(1);
    await flushPromises();
    expect(grid(wrapper).props('loading')).toBe(false);
    expect(grid(wrapper).props('rowData')).toEqual(items);
  });

  it('строит путь строки по цепочке родителей из хранилища', async () => {
    const wrapper = mountTable();
    await vi.advanceTimersByTimeAsync(2000);
    await flushPromises();

    const getDataPath = grid(wrapper).props('getDataPath') as (item: unknown) => string[];
    expect(getDataPath(items[2])).toEqual(['1', '2', '3']);
  });

  it('определяет колонку категории по наличию потомков', async () => {
    const wrapper = mountTable();
    await vi.advanceTimersByTimeAsync(2000);
    await flushPromises();

    const defs = grid(wrapper).props('columnDefs') as {
      colId: string;
      cellRendererParams?: { innerRenderer: (p: { data: unknown }) => string };
    }[];
    const render = defs.find((d) => d.colId === 'category')!.cellRendererParams!.innerRenderer;
    expect(render({ data: items[0] })).toBe('Группа');
    expect(render({ data: items[2] })).toBe('Элемент');
  });
});
