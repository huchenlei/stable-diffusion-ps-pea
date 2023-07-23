<template>
  <a-row>
    <a-col :span="12">
      <a-input placeholder="Enter new config entry name" v-model="newEntryName" />
      <a-button @click="createNewEntry" type="primary" style="margin-top: 10px">Create New Entry</a-button>
    </a-col>
    <a-col :span="12">
      <a-select placeholder="Select a config entry" v-model="selectedEntry" style="width: 100%">
        <a-select-option v-for="(value, key) in configEntries" :key="key" :value="key">{{ key }}</a-select-option>
      </a-select>
    </a-col>
  </a-row>
  <json5-editor :value="configEntries[selectedEntry]" @update:modelValue="updateEntry"></json5-editor>
  <a-button @click="downloadConfig" type="primary" icon="download" style="margin-top: 10px">Download Config</a-button>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useConfigStore } from '@/stores/configStore';
import JSON5 from 'json5';
import Json5Editor from '@/components/Json5Editor.vue';

const store = useConfigStore();
const configEntries = store.configEntries;
const newEntryName = ref("");
const selectedEntry = ref(Object.keys(configEntries)[0]);

watch(() => store.configEntries, () => {
  selectedEntry.value = Object.keys(store.configEntries)[0];
}, { immediate: true });

const createNewEntry = () => {
  if (newEntryName.value.trim() !== "") {
    store.createConfigEntry({ [newEntryName.value]: {} });
    newEntryName.value = "";
  }
}

const updateEntry = (newValue: any) => {
  store.createConfigEntry({ [selectedEntry.value]: newValue });
}

const downloadConfig = () => {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON5.stringify(store.configEntries[selectedEntry.value]));
  const downloadAnchorNode = document.createElement('a');
  downloadAnchorNode.setAttribute("href", dataStr);
  downloadAnchorNode.setAttribute("download", selectedEntry.value + ".json5");
  document.body.appendChild(downloadAnchorNode);
  downloadAnchorNode.click();
  downloadAnchorNode.remove();
}
</script>
