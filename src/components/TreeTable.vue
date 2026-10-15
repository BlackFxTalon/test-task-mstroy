<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { AgGridVue } from 'ag-grid-vue3';
import type {
  ColDef,
  GetDataPath,
  GetRowIdParams,
  ModelUpdatedEvent,
  ValueGetterParams,
} from 'ag-grid-community';
import '../grid/setup';
import { loadItems } from '../api/loadItems';
import { useTreeStore } from '../composables/useTreeStore';
import type { ITreeItem } from '../store/TreeStore';

const { store, items, setItems } = useTreeStore();
const loading = ref(true);

const isGroup = (item: ITreeItem | undefined) => item !== undefined && store.getChildren(item.id).length > 0;
const categoryOf = (item: ITreeItem | undefined) => (isGroup(item) ? 'Группа' : 'Элемент');

const columnDefs: ColDef<ITreeItem>[] = [
  {
    colId: 'index',
    headerName: '№ п\\п',
    width: 100,
    sortable: false,
    cellClass: 'cell-group',
    valueGetter: (params: ValueGetterParams<ITreeItem>) => (params.node?.rowIndex ?? 0) + 1,
  },
  {
    colId: 'category',
    headerName: 'Категория',
    width: 260,
    showRowGroup: true,
    cellRenderer: 'agGroupCellRenderer',
    cellRendererParams: {
      suppressCount: true,
      innerRenderer: (params: { data?: ITreeItem }) => categoryOf(params.data),
    },
  },
  {
    colId: 'label',
    headerName: 'Наименование',
    field: 'label',
    flex: 1,
    minWidth: 200,
    cellClassRules: { 'cell-group': (params) => isGroup(params.data) },
  },
];

const getDataPath: GetDataPath<ITreeItem> = (item) =>
  store
    .getAllParents(item.id)
    .reverse()
    .map((parent) => String(parent.id));

const defaultColDef: ColDef<ITreeItem> = { suppressHeaderMenuButton: true, resizable: false };

const localeText = { loadingOoo: 'Загрузка...' };

const getRowId = (params: GetRowIdParams<ITreeItem>) => String(params.data.id);

function onModelUpdated(event: ModelUpdatedEvent<ITreeItem>) {
  event.api.refreshCells({ columns: ['index'], force: true });
}

onMounted(async () => {
  setItems(await loadItems());
  loading.value = false;
});
</script>

<template>
  <ag-grid-vue
    class="tree-table"
    :column-defs="columnDefs"
    :default-col-def="defaultColDef"
    :locale-text="localeText"
    :row-data="items"
    :loading="loading"
    dom-layout="autoHeight"
    :tree-data="true"
    tree-data-display-type="custom"
    :group-default-expanded="-1"
    :get-data-path="getDataPath"
    :get-row-id="getRowId"
    :suppress-movable-columns="true"
    @model-updated="onModelUpdated"
  />
</template>

<style scoped>
.tree-table {
  width: 100%;
  max-width: 900px;
  --ag-row-group-indent-size: 12px;
}
:deep(.ag-header-cell-resize) {
  display: none;
}
:deep(.cell-group),
:deep(.ag-row-group) {
  font-weight: 600;
}
:deep(.ag-grid-scrolling-cells) {
  --ag-header-background-color: white;
}
:deep(:where(.ag-ltr) .ag-header-cell:after, :where(.ag-ltr) .ag-header-group-cell:after) {
   --ag-header-column-border: 1px solid color-mix(in srgb, transparent, var(--ag-inherited-foreground-color, #181d1f) 15%)
}
:deep(.ag-layout-auto-height) {
  --ag-auto-height-min-body-height: auto;
}
:deep(.ag-root-wrapper) {
  --ag-wrapper-border: 15px solid #f3f2f1;
}
:deep(:where(.ag-ltr) .ag-cell-wrapper) {
  padding-left: 0;
}
:deep(.ag-cell-wrapper .ag-group-value) {
  margin-left: calc(var(--ag-indentation-level) * var(--ag-row-group-indent-size));
}
:deep(:where(.ag-ltr) .ag-group-expanded) {
  margin-right: 16px;
}
</style>
