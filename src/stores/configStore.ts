import { defineStore } from 'pinia';
import JSON5 from 'json5';
import { type IApplicationState, ApplicationState } from '@/Core';

const DEFAULT_CONFIG = new ApplicationState();
// Fetch configs from local storage.
function fetchConfigs() {
    const localConfigString = localStorage.getItem('configEntries');
    if (!localConfigString || localConfigString === '{}') {
        return { default: DEFAULT_CONFIG };
    } else {
        return JSON5.parse(localConfigString);
    }
}

export const useConfigStore = defineStore('configStore', {
    state: () => ({
        configEntries: fetchConfigs(),
        selectedConfigName: localStorage.getItem('selectedConfig') || 'default'
    }),
    actions: {
        createConfigEntry(entry: Record<string, IApplicationState>) {
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
        setDefaultConfig() {
            this.configEntries = { default: DEFAULT_CONFIG };
            this.persistConfigEntries();
        },
        getCurrentConfig(): IApplicationState {
            return this.configEntries[this.selectedConfigName];
        },
    },
});