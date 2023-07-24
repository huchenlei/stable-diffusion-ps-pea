<script lang="ts">
import { diff, type Diff } from 'deep-diff';
import { ApplicationState, type IApplicationState } from '@/Core';
import { useConfigStore } from '@/stores/configStore';
import { computed } from 'vue';

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

        return {
            stateDiff,
            removeDiff,
        };
    },
};
</script>

<template>
    <a-collapse-panel>
        <template #header>
            {{ stateDiff['commonPayload.prompt']?.value || '' }}
            <a-tag>{{ `${new Date($props.timestamp).toLocaleString()}` }}</a-tag>
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