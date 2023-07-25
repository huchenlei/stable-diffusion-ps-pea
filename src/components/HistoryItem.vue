<script lang="ts">
import { diff, type Diff } from 'deep-diff';
import { ApplicationState, type IApplicationState } from '@/Core';
import { useConfigStore } from '@/stores/configStore';
import { computed, ref } from 'vue';
import { LeftSquareOutlined, SaveOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons-vue'
import { useAppStateStore } from '@/stores/appStateStore';
import { message } from 'ant-design-vue';

export default {
    name: 'HistoryItem',
    props: {
        timestamp: {
            type: Number,
            required: true,
        },
        appState: {
            type: ApplicationState,
            required: true,
        }
    },
    components: {
        LeftSquareOutlined,
        SaveOutlined,
        CheckOutlined,
        CloseOutlined,
    },
    setup(props) {
        function formatDiff(diffEntries: Diff<IApplicationState, IApplicationState>[]) {
            return Object.fromEntries(diffEntries.map(diffEntry => {
                const path = diffEntry.path!.join('.');
                if (diffEntry.kind !== 'E') {
                    console.error(`Unexpected diff kind: ${JSON.stringify(diffEntry)}`);
                    return [path, { value: 'Error', default: 'Error' }];
                }
                return [path, {
                    value: diffEntry.rhs,
                    default: diffEntry.lhs,
                }];
            }));
        }

        const stateDiff = computed(() => {
            const defaultState = useConfigStore().getCurrentConfig();
            return formatDiff(diff(defaultState, props.appState) || []);
        });

        // Reset the given path to default value
        function removeDiff(path: string, defaultValue: any) {
            function setValue(obj: any, pathString: string, value: any) {
                let i;
                const path = pathString.split('.');
                for (i = 0; i < path.length - 1; i++)
                    obj = obj[path[i]];

                obj[path[i]] = value;
            }
            setValue(props.appState, path, defaultValue);
        }

        const appStateStore = useAppStateStore();
        function sendAppState() {
            appStateStore.setAppState(props.appState);
            message.info('State restored from history');
        }

        const configName = ref('');
        const configStore = useConfigStore();
        function saveAppStateAsConfig() {
            if (!configName.value) {
                message.warn('Config name cannot be empty');
            } else {
                // configStore.createConfigEntry({ [configName.value]: props.appState });
                message.info('State saved');
            }
            configName.value = '';
        }

        return {
            stateDiff,
            configName,
            removeDiff,
            sendAppState,
            saveAppStateAsConfig,
        };
    },
};
</script>

<template>
    <a-collapse-panel>
        <template #header>
            <div style="display: flex; justify-content: space-between; width: 100%;">
                <div>
                    {{ stateDiff['commonPayload.prompt']?.value || '' }}
                    <a-tag>{{ `${new Date($props.timestamp).toLocaleString()}` }}</a-tag>
                </div>
                <div>
                    <a-button @click.stop="sendAppState">
                        <LeftSquareOutlined></LeftSquareOutlined>
                    </a-button>
                    <a-popconfirm :showCancel="false">
                        <template #title>
                            <a-input :placeholder="$t('config.newConfig')" v-model:value="configName">
                            </a-input>
                        </template>
                        <template #okButton>
                            <a-button size="small" type="primary" @click="saveAppStateAsConfig">
                                <CheckOutlined></CheckOutlined>
                            </a-button>
                        </template>
                        <a-button @click.stop="() => { }">
                            <SaveOutlined></SaveOutlined>
                        </a-button>
                    </a-popconfirm>
                </div>
            </div>
        </template>
        <a-space style="flex-wrap: wrap;">
            <a-tag v-for="[path, entry] in Object.entries(stateDiff)" closable
                @close="removeDiff(path, (entry as any).default)">
                <span class="path">{{ path }}</span>:
                <span class="value">{{ (entry as any).value }}</span>
            </a-tag>
        </a-space>
    </a-collapse-panel>
</template>

<style scoped>
.path {
    font-weight: bold;
}
</style>