<script setup lang="ts">
import TreeTable from './components/TreeTable.vue';
</script>

<template>
  <main class="main">
    <TreeTable />
  </main>
</template>

<style>
html,
body,
#app {
  height: 100%;
  margin: 0;
}
.main {
  box-sizing: border-box;
  height: 100%;
  padding: 24px;
}
</style>
