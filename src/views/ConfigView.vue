<template>
  <div v-bind="$attrs" id="config-view">
    <a-divider orientation="left" orientation-margin="0px" size="small">
      {{ $t('config.toolbox') }}
    </a-divider>
    <a-select :value="store.toolboxConfigNames" @update:value="onToolBoxChange" mode="multiple" style="width: 100%"
      :placeholder="$t('config.selectConfig') + '...'" :options="allConfigOptions">
    </a-select>

    <a-divider orientation="left" orientation-margin="0px" size="small">
      {{ $t('config.defaults') }}: ({{ store.baseConfigName }})
    </a-divider>
    <a-space direction="vertical" style="width: 100%">
      <div style="display: flex">
        <a-input :placeholder="$t('config.newConfig')" v-model:value="newEntryName" style="flex-grow: 1;">
        </a-input>
        <a-button @click="createNewEntry"><plus-outlined></plus-outlined></a-button>
      </div>
      <div style="display: flex">
        <a-select :value="editorConfigName" @update:value="onSelectConfig" :options="allConfigOptions" show-search
          :filter-option="filterConfig" style="flex-grow: 1;">
        </a-select>
        <a-button @click="toggleViewDiff" :title="$t('config.toggleViewDiff')">{{ viewDiff ? 'D' : 'A' }}</a-button>
        <a-button @click="deleteSelectedConfig" :disabled="isLastConfig"
          :title="$t('config.deleteConfig')"><delete-outlined></delete-outlined></a-button>
        <a-button @click="saveConfig" :title="$t('config.saveConfig')"><save-outlined></save-outlined></a-button>
        <a-button @click="activateConfig" :title="$t('config.activateConfig')"
          type="primary"><check-outlined></check-outlined>
        </a-button>
      </div>
      <a-row>
        <a-col :span="12">
          <a-button @click="downloadConfig" :title="$t('config.downloadConfig')"
            style="width: 100%;"><download-outlined></download-outlined>
            {{ $t('config.download') }}</a-button>
        </a-col>
        <a-col :span="12">
          <a-upload :beforeUpload="uploadConfig" :showUploadList="false"
            style="display: block;">
            <a-button :title="$t('config.uploadConfig')" style="width: 100%;"><upload-outlined></upload-outlined> {{
              $t('config.upload')
            }}</a-button>
          </a-upload>
        </a-col>
      </a-row>
      <json5-editor :value="editorValue" @update:modelValue="updateEntry"></json5-editor>
    </a-space>
  </div>
</template>
<style>
#config-view .ant-upload {
  display: block !important;
  width: 100%;
}
</style>

<script setup lang="ts">
import { computed, ref, toRaw } from 'vue';
import { useConfigStore } from '@/stores/configStore';
import Json5Editor from '@/components/Json5Editor.vue';
import JSON5 from 'json5';
import { DeleteOutlined, DownloadOutlined, PlusOutlined, SaveOutlined, UploadOutlined, CheckOutlined } from '@ant-design/icons-vue';
import { type IApplicationState } from '@/Core';
import { message } from 'ant-design-vue';
import { type StateDiff, stateDiffToAppState, appStateToStateDiff } from '@/Config';
import _ from 'lodash';

const store = useConfigStore();
store.initializeConfigEntries();

const allConfigOptions = computed(() => Object.keys(store.configEntries).map(configName => {
  return {
    label: configName,
    value: configName,
  };
}));
const newEntryName = ref<string>("");
const currentAppStateContent = ref<IApplicationState>(stateDiffToAppState(store.getCurrentConfig()));
const currentStateDiffContent = ref<StateDiff>(store.getCurrentConfig());
const editorConfigName = ref<string>(store.baseConfigName);

let appStateContentBuffer = currentAppStateContent.value;
let stateDiffContentBuffer = currentStateDiffContent.value;

const viewDiff = ref<boolean>(false);
const editorValue = computed(() => {
  return viewDiff.value ? currentStateDiffContent.value : currentAppStateContent.value;
});

const isLastConfig = computed(() => Object.keys(store.configEntries).length === 1);

const createNewEntry = () => {
  if (newEntryName.value.trim() === "") {
    message.warn("Config name cannot be empty.");
  }

  message.info(`Create new config: ${newEntryName.value} based on ${editorConfigName.value}`);
  store.createConfigEntry({ [newEntryName.value]: _.cloneDeep(currentStateDiffContent.value) });
  editorConfigName.value = newEntryName.value;
  newEntryName.value = "";
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
  if (store.baseConfigName === editorConfigName.value) {
    message.warn("Cannot delete active config.");
    return;
  }

  message.info(`Delete config ${editorConfigName.value}`);
  store.deleteConfigEntry(editorConfigName.value);
  editorConfigName.value = Object.keys(store.configEntries)[0];
}

const saveConfig = () => {
  flushContentBuffer();
  if (currentAppStateContent.value) {
    console.debug(`Save config ${JSON.stringify(currentAppStateContent.value)}`);

    const stateDiff = viewDiff.value ?
      currentStateDiffContent.value :
      appStateToStateDiff(currentAppStateContent.value);

    store.createConfigEntry({ [editorConfigName.value]: stateDiff });
    message.info(`Save config ${editorConfigName.value}`);
  }
  console.debug(`No editor content for saving.`);
}

const activateConfig = () => {
  flushContentBuffer();
  store.updateCurrentConfig(editorConfigName.value);
}

const downloadConfig = () => {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(
    JSON5.stringify(toRaw(store.configEntries)));
  const downloadAnchorNode = document.createElement('a');
  downloadAnchorNode.setAttribute("href", dataStr);
  downloadAnchorNode.setAttribute("download", "configs.json5");
  document.body.appendChild(downloadAnchorNode);
  downloadAnchorNode.click();
  downloadAnchorNode.remove();
}

function readJson(file: Blob): Promise<Object> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        resolve(JSON5.parse(e.target!.result! as string));
      } catch (ex: any) {
        reject(ex);
      }
    };
    reader.readAsText(file);
  });
}

const uploadConfig = async (file: Blob) => {
  store.createConfigEntry(await readJson(file) as Record<string, StateDiff>);
  return false; // Return false to prevent default upload behaviour.
};

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
  editorConfigName.value = configName;

  currentAppStateContent.value = stateDiffToAppState(store.configEntries[configName]);
  currentStateDiffContent.value = store.configEntries[configName];

  appStateContentBuffer = currentAppStateContent.value;
  stateDiffContentBuffer = currentStateDiffContent.value;
};

const onToolBoxChange = (toolboxConfigNames: string[]) => {
  store.toolboxConfigNames = toolboxConfigNames;
  store.persistToolbox();
};
</script>
