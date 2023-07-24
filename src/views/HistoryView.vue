<script setup lang="ts">
import { ref, computed } from 'vue';
import { useHistoryStore } from '@/stores/historyStore';
import HistoryItem from '@/components/HistoryItem.vue';

const historyStore = useHistoryStore();
const totalHistoryItems = computed(() => historyStore.getHistoryItems().length);
const pageSize = ref<number>(10);
const currentPage = ref<number>(1);
const currentPageItems = computed(() => {
  const startIndex = (currentPage.value - 1) * pageSize.value;
  const endIndex = startIndex + pageSize.value;
  return historyStore.getHistoryItems().slice(startIndex, endIndex);
});

</script>

<template>
  <a-space direction="vertical" style="width: 100%; margin-top: 10px;">
    <div class="center-horizontal">
      <a-pagination v-model:current="currentPage" v-model:pageSize="pageSize" :total="totalHistoryItems" />
    </div>
    <a-collapse>
      <HistoryItem v-for="pageItem in currentPageItems" :timestamp="pageItem.timestamp" :appState="pageItem.appState">
      </HistoryItem>
    </a-collapse>
  </a-space>
</template>

<style scoped>
.center-horizontal {
  display: grid;
  justify-items: center;
  /* Aligns items on the horizontal line */
}
</style>
