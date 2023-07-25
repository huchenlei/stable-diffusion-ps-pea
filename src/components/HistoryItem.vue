<script lang="ts">
import { ApplicationState } from '@/Core';
import { useConfigStore } from '@/stores/configStore';
import { computed, ref } from 'vue';
import { LeftSquareOutlined, SaveOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons-vue'
import { useAppStateStore } from '@/stores/appStateStore';
import { message } from 'ant-design-vue';
import { stateDiffToAppState, appStateToStateDiff } from '@/Config';
import router from '@/router';

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
        const stateDiff = computed(() => {
            const defaultState = stateDiffToAppState(useConfigStore().getCurrentConfig());
            return appStateToStateDiff(props.appState, defaultState);
        });

        const appStateStore = useAppStateStore();
        function sendAppState() {
            appStateStore.setAppState(props.appState);
            message.info('State restored from history');
            router.push('/generation');
        }

        const configName = ref('');
        const configStore = useConfigStore();
        function saveAppStateAsConfig() {
            if (!configName.value) {
                message.warn('Config name cannot be empty');
            } else {
                configStore.createConfigEntry({ [configName.value]: stateDiff.value });
                message.info('State saved');
                router.push('/config');
            }
            configName.value = '';
        }

        return {
            stateDiff,
            configName,
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
            <a-tag v-for="diffEntry in stateDiff">
                <span class="path">{{ (diffEntry.path || []).join('.') }}</span>:
                <span v-if="diffEntry.kind === 'E'" class="item">{{ diffEntry.rhs }}</span>
                <span v-if="diffEntry.kind === 'A'" class="item">{{ diffEntry.item }}</span>
            </a-tag>
        </a-space>
    </a-collapse-panel>
</template>

<style scoped>
.path {
    font-weight: bold;
}

.item {
    text-wrap: wrap;
    word-break: break-all;
}
</style>