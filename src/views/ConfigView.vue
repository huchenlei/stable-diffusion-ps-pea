<template>
  <a-space direction="vertical" style="width: 100%">
    <div style="display: flex">
      <a-input :placeholder="$t('config.newConfig')" v-model="newEntryName" style="flex-grow: 1;">
      </a-input>
      <a-button @click="createNewEntry"><plus-outlined></plus-outlined></a-button>
    </div>
    <div style="display: flex">
      <a-select v-model:value="store.selectedConfigName" :options="allConfigOptions" style="flex-grow: 1;">
      </a-select>
      <a-button @click="downloadConfig"
        :title="$t('config.downloadConfig')"><download-outlined></download-outlined></a-button>
      <a-button @click="deleteSelectedConfig"
        :title="$t('config.deleteConfig')"><delete-outlined></delete-outlined></a-button>
      <a-button @click="saveConfig" :title="$t('config.saveConfig')"><save-outlined></save-outlined></a-button>
    </div>
    <json5-editor :value="store.getCurrentConfig()" @update:modelValue="updateEntry"></json5-editor>
  </a-space>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useConfigStore } from '@/stores/configStore';
import JSON5 from 'json5';
import Json5Editor from '@/components/Json5Editor.vue';
import { DeleteOutlined, DownloadOutlined, PlusOutlined, SaveOutlined } from '@ant-design/icons-vue';
import { ApplicationState, type IApplicationState } from '@/Core';

const store = useConfigStore();
const allConfigOptions = computed(() => Object.keys(store.configEntries).map(configName => {
  return {
    label: configName,
    value: configName,
  };
}));
const newEntryName = ref<string>("");
const currentConfigContent = ref<IApplicationState | null>(null);

const createNewEntry = () => {
  if (newEntryName.value.trim() !== "") {
    store.createConfigEntry({ [newEntryName.value]: new ApplicationState() });
    store.selectedConfigName = newEntryName.value;
    newEntryName.value = "";
  }
}

const updateEntry = (newValue: IApplicationState) => {
  currentConfigContent.value = newValue;
}

const deleteSelectedConfig = () => {
  store.deleteConfigEntry(store.selectedConfigName);
}

const saveConfig = () => {
  if (currentConfigContent.value)
    store.createConfigEntry({ [store.selectedConfigName]: currentConfigContent.value });
}

const downloadConfig = () => {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON5.stringify(store.getCurrentConfig()));
  const downloadAnchorNode = document.createElement('a');
  downloadAnchorNode.setAttribute("href", dataStr);
  downloadAnchorNode.setAttribute("download", store.selectedConfigName + ".json5");
  document.body.appendChild(downloadAnchorNode);
  downloadAnchorNode.click();
  downloadAnchorNode.remove();
}
</script>
