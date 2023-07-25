import { defineStore } from 'pinia';
import JSON5 from 'json5';
import type { StateDiff } from '@/Config';

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
        selectedConfigName: localStorage.getItem('selectedConfig') || 'default'
    }),
    actions: {
        createConfigEntry(entry: Record<string, StateDiff>) {
            this.configEntries = { ...this.configEntries, ...entry };
            this.persistConfigEntries();
        },
        persistConfigEntries() {
            localStorage.setItem('configEntries', JSON5.stringify(this.configEntries));
        },
        deleteConfigEntry(entryName: string) {
            const { [entryName]: _, ...remainingEntries } = this.configEntries;
            this.configEntries = remainingEntries;
            this.persistConfigEntries();
        },
        getCurrentConfig(): StateDiff {
            return this.configEntries[this.selectedConfigName];
        },
        updateCurrentConfig(configName: string) {
            this.selectedConfigName = configName;
            localStorage.setItem('selectedConfig', configName);
        },
    },
});