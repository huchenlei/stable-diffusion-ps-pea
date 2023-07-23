<template>
  <a-space direction="vertical" style="width: 100%">
    <a-input :placeholder="$t('config.newConfig')" v-model="newEntryName">
      <template #addonAfter>
        <a-button @click="createNewEntry" :block="true" type="text"
          size="small"><plus-outlined></plus-outlined></a-button>
      </template>
    </a-input>
    <div style="display: flex">
      <a-select v-model="selectedEntry" style="flex-grow: 1;">
        <a-select-option v-for="(value, key) in configEntries" :key="key" :value="key">{{ key }}</a-select-option>
      </a-select>
      <a-button @click="downloadConfig" :title="$t('config.downloadConfig')"><download-outlined></download-outlined></a-button>
      <a-button @click="deleteSelectedConfig" :title="$t('config.deleteConfig')"><delete-outlined></delete-outlined></a-button>
    </div>
    <json5-editor :value="configEntries[selectedEntry]" @update:modelValue="updateEntry"></json5-editor>
  </a-space>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useConfigStore } from '@/stores/configStore';
import JSON5 from 'json5';
import Json5Editor from '@/components/Json5Editor.vue';
import { DeleteOutlined, DownloadOutlined, PlusOutlined } from '@ant-design/icons-vue';

const store = useConfigStore();
const configEntries = store.configEntries;
const newEntryName = ref<string>("");
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

const deleteSelectedConfig = () => {
  store.deleteConfigEntry(selectedEntry.value);
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
