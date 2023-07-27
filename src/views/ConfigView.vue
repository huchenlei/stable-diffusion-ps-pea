<template>
  <a-divider orientation="left" orientation-margin="0px" size="small">
    {{ $t('config.toolbox') }}
  </a-divider>
  <a-select v-model:value="store.toolboxConfigNames" mode="multiple" style="width: 100%"
    :placeholder="$t('config.selectConfig') + '...'" :options="allConfigOptions">
  </a-select>

  <a-divider orientation="left" orientation-margin="0px" size="small">
    {{ $t('config.defaults') }}
  </a-divider>
  <a-space direction="vertical" style="width: 100%">
    <div style="display: flex">
      <a-input :placeholder="$t('config.newConfig')" v-model:value="newEntryName" style="flex-grow: 1;">
      </a-input>
      <a-button @click="createNewEntry"><plus-outlined></plus-outlined></a-button>
    </div>
    <div style="display: flex">
      <a-select :value="store.baseConfigName" @update:value="onSelectConfig" :options="allConfigOptions" show-search
        :filter-option="filterConfig" style="flex-grow: 1;">
      </a-select>
      <a-button @click="toggleViewDiff" :title="$t('config.toggleViewDiff')">{{ viewDiff ? 'D' : 'A' }}</a-button>
      <a-button @click="downloadConfig"
        :title="$t('config.downloadConfig')"><download-outlined></download-outlined></a-button>
      <a-button @click="deleteSelectedConfig" :disabled="isLastConfig"
        :title="$t('config.deleteConfig')"><delete-outlined></delete-outlined></a-button>
      <a-button @click="saveConfig" :title="$t('config.saveConfig')"><save-outlined></save-outlined></a-button>
    </div>
    <json5-editor :value="editorValue" @update:modelValue="updateEntry"></json5-editor>
  </a-space>
</template>

<script setup lang="ts">
import { computed, ref, toRaw } from 'vue';
import { useConfigStore } from '@/stores/configStore';
import Json5Editor from '@/components/Json5Editor.vue';
import { DeleteOutlined, DownloadOutlined, PlusOutlined, SaveOutlined } from '@ant-design/icons-vue';
import { type IApplicationState } from '@/Core';
import { message } from 'ant-design-vue';
import { type StateDiff, stateDiffToAppState, appStateToStateDiff } from '@/Config';

const store = useConfigStore();
const allConfigOptions = computed(() => Object.keys(store.configEntries).map(configName => {
  return {
    label: configName,
    value: configName,
  };
}));
const newEntryName = ref<string>("");
const currentAppStateContent = ref<IApplicationState>(stateDiffToAppState(store.getCurrentConfig()));
const currentStateDiffContent = ref<StateDiff>(store.getCurrentConfig());

let appStateContentBuffer = currentAppStateContent.value;
let stateDiffContentBuffer = currentStateDiffContent.value;

const viewDiff = ref<boolean>(false);
const editorValue = computed(() => {
  return viewDiff.value ? currentStateDiffContent.value : currentAppStateContent.value;
});

const isLastConfig = computed(() => Object.keys(store.configEntries).length === 1);

const createNewEntry = () => {
  if (newEntryName.value.trim() !== "") {
    console.debug(`Create new config: ${newEntryName.value}`);
    store.createConfigEntry({ [newEntryName.value]: [] });
    store.baseConfigName = newEntryName.value;
    newEntryName.value = "";
  }
}

const updateEntry = (newValue: IApplicationState | StateDiff) => {
  if (viewDiff.value) {
    stateDiffContentBuffer = newValue as StateDiff;
  } else {
    appStateContentBuffer = newValue as IApplicationState;
  }
}

const flushContentBuffer = () => {
  currentStateDiffContent.value = stateDiffContentBuffer;
  currentAppStateContent.value = appStateContentBuffer;
}

const deleteSelectedConfig = () => {
  console.debug(`Delete config ${store.baseConfigName}`);

  store.deleteConfigEntry(store.baseConfigName);
  store.baseConfigName = Object.keys(store.configEntries)[0];
}

const saveConfig = () => {
  flushContentBuffer();
  if (currentAppStateContent.value) {
    console.debug(`Save config ${JSON.stringify(currentAppStateContent.value)}`);

    const stateDiff = viewDiff.value ?
      currentStateDiffContent.value :
      appStateToStateDiff(currentAppStateContent.value);

    store.createConfigEntry({ [store.baseConfigName]: stateDiff });
    message.info(`Save config ${store.baseConfigName}`);
  }
  console.debug(`No editor content for saving.`);
}

const downloadConfig = () => {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(
    JSON.stringify(toRaw(store.getCurrentConfig())));
  const downloadAnchorNode = document.createElement('a');
  downloadAnchorNode.setAttribute("href", dataStr);
  downloadAnchorNode.setAttribute("download", store.baseConfigName + ".json");
  document.body.appendChild(downloadAnchorNode);
  downloadAnchorNode.click();
  downloadAnchorNode.remove();
}

const filterConfig = (input: string, option: any) => {
  return option.value.toLowerCase().indexOf(input.toLowerCase()) >= 0;
};

const toggleViewDiff = () => {
  flushContentBuffer();
  if (viewDiff.value) {
    // Diff => AppState
    currentAppStateContent.value = stateDiffToAppState(toRaw(currentStateDiffContent.value));
  } else {
    // AppState => Diff
    currentStateDiffContent.value = appStateToStateDiff(toRaw(currentAppStateContent.value));
  }
  viewDiff.value = !viewDiff.value;
};

const onSelectConfig = (configName: string) => {
  store.updateCurrentConfig(configName);

  currentAppStateContent.value = stateDiffToAppState(store.getCurrentConfig());
  currentStateDiffContent.value = store.getCurrentConfig();
};
</script>
