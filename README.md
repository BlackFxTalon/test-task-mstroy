# test-task-mstroy

Тестовое задание MStroy Frontend v3.2: класс `TreeStore` (TypeScript) и Vue 3 компонент
с таблицей AgGrid (Tree Data, Enterprise) для его визуализации.

## Запуск

```bash
npm install
npm run dev        # приложение
npm test           # все тесты
npm run bench      # тесты производительности TreeStore (200 000 элементов)
npm run typecheck  # проверка типов
npm run build
```

## Структура

- `src/store/TreeStore.ts` — хранилище дерева.
- `src/api/loadItems.ts` — загрузка `public/items.json` через `fetch` с задержкой 2 с.
- `src/composables/useTreeStore.ts` — обёртка, делающая изменения хранилища реактивными.
- `src/components/TreeTable.vue` — таблица на `ag-grid-vue3`.
- `tests/` — unit-тесты, тесты производительности и тесты компонента.

## TreeStore

Элементы индексируются по `id` и по `parent` (`Map`), поэтому методы не обходят весь массив:

| Метод | Сложность |
| --- | --- |
| `getItem`, `getChildren` | O(1) / O(k) |
| `getAllParents` | O(глубина) |
| `getAllChildren` | O(размер поддерева) |
| `addItem`, `updateItem`, `removeItem` | O(1) / O(размер удаляемого поддерева) |
| `getAll` | O(n) (копия кэшированного массива, кэш пересобирается после изменений) |

Принятые допущения:

- `getItem` для неизвестного `id` возвращает `undefined`, остальные методы чтения возвращают `[]`.
- Элемент, чей родитель отсутствует в хранилище, считается корневым.
- `getAllChildren` возвращает потомков в порядке обхода в ширину.
- `getAllParents` защищён от циклов.
- `addItem` с существующим `id` и `updateItem` с неизвестным `id` выбрасывают ошибку; `removeItem` с неизвестным `id` ничего не делает.
- `updateItem` заменяет элемент и умеет менять `parent`.

## Таблица

AgGrid Enterprise работает в пробном режиме (без лицензионного ключа), поэтому в консоли
выводится сообщение о лицензии и показывается водяной знак.
