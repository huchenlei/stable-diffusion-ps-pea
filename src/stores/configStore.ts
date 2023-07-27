import { defineStore } from 'pinia';
import JSON5 from 'json5';
import type { StateDiff } from '@/Config';
import { toRaw } from 'vue';

// Fetch configs from local storage.
function fetchConfigs(): Record<string, StateDiff> {
    const localConfigString = localStorage.getItem('configEntries');
    if (!localConfigString || localConfigString === '{}') {
        return { default: [] };
    } else {
        return JSON5.parse(localConfigString);
    }
}

// There are 3 levels of configs:
// - Default: The base config. All other configs are references of the base config.
// - Base: The alwayson config in generation.
// - Addon: The optional come-and-go config that can be easily modified from run
// to run.
// Base and addon config should all be delta with reference to Default config.
export const useConfigStore = defineStore('configStore', {
    state: () => ({
        configEntries: fetchConfigs(),
        baseConfigName: localStorage.getItem('baseConfig') || 'default',
        toolboxConfigNames: (JSON5.parse(localStorage.getItem('toolboxConfigs') || '[]')) as string[],
    }),
    actions: {
        createConfigEntry(entry: Record<string, StateDiff>) {
            this.configEntries = { ...this.configEntries, ...entry };
            this.persistConfigEntries();
        },
        persistConfigEntries() {
            localStorage.setItem('configEntries', JSON5.stringify(toRaw(this.configEntries)));
        },
        deleteConfigEntry(entryName: string) {
            const { [entryName]: _, ...remainingEntries } = this.configEntries;
            this.configEntries = remainingEntries;
            this.persistConfigEntries();
        },
        getCurrentConfig(): StateDiff {
            return this.configEntries[this.baseConfigName];
        },
        updateCurrentConfig(configName: string) {
            this.baseConfigName = configName;
            localStorage.setItem('baseConfig', configName);
        },
        persistToolbox() {
            localStorage.setItem('toolboxConfigs', JSON5.stringify(toRaw(this.toolboxConfigNames)));
        },
    },
});