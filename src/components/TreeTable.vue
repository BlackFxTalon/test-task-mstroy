<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { AgGridVue } from 'ag-grid-vue3';
import type {
  ColDef,
  GetDataPath,
  GetRowIdParams,
  GridApi,
  GridReadyEvent,
  ModelUpdatedEvent,
  ValueGetterParams,
} from 'ag-grid-community';
import '../grid/setup';
import { loadItems } from '../api/loadItems';
import { useTreeStore } from '../composables/useTreeStore';
import type { TreeItem } from '../store/TreeStore';

const { store, items, setItems } = useTreeStore();
const loading = ref(true);
let api: GridApi<TreeItem> | null = null;

const isGroup = (item: TreeItem | undefined) => item !== undefined && store.getChildren(item.id).length > 0;
const categoryOf = (item: TreeItem | undefined) => (isGroup(item) ? 'Группа' : 'Элемент');

const columnDefs: ColDef<TreeItem>[] = [
  {
    colId: 'index',
    headerName: '№ п\\п',
    width: 100,
    sortable: false,
    valueGetter: (params: ValueGetterParams<TreeItem>) => (params.node?.rowIndex ?? 0) + 1,
  },
  {
    colId: 'category',
    headerName: 'Категория',
    width: 260,
    showRowGroup: true,
    cellRenderer: 'agGroupCellRenderer',
    cellRendererParams: {
      suppressCount: true,
      innerRenderer: (params: { data?: TreeItem }) => categoryOf(params.data),
    },
  },
  {
    colId: 'label',
    headerName: 'Наименование',
    field: 'label',
    flex: 1,
    cellClassRules: { 'cell-group': (params) => isGroup(params.data) },
  },
];

const getDataPath: GetDataPath<TreeItem> = (item) =>
  store
    .getAllParents(item.id)
    .reverse()
    .map((parent) => String(parent.id));

const defaultColDef: ColDef<TreeItem> = { suppressHeaderMenuButton: true };

const localeText = { loadingOoo: 'Загрузка...' };

const getRowId = (params: GetRowIdParams<TreeItem>) => String(params.data.id);

function onGridReady(event: GridReadyEvent<TreeItem>) {
  api = event.api;
}

// Row numbers depend on the current row position, so refresh them when rows are expanded or collapsed.
function onModelUpdated(event: ModelUpdatedEvent<TreeItem>) {
  event.api.refreshCells({ columns: ['index'], force: true });
}

onMounted(async () => {
  setItems(await loadItems());
  loading.value = false;
});

defineExpose({ store, loading, getApi: () => api });
</script>

<template>
  <ag-grid-vue
    class="tree-table"
    :column-defs="columnDefs"
    :default-col-def="defaultColDef"
    :locale-text="localeText"
    :row-data="items"
    :loading="loading"
    :tree-data="true"
    tree-data-display-type="custom"
    :group-default-expanded="-1"
    :get-data-path="getDataPath"
    :get-row-id="getRowId"
    :suppress-movable-columns="true"
    @grid-ready="onGridReady"
    @model-updated="onModelUpdated"
  />
</template>

<style scoped>
.tree-table {
  width: 100%;
  height: 100%;
}
:deep(.cell-group) {
  font-weight: 600;
}
</style>
