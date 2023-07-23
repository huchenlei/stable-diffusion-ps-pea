import { defineStore } from 'pinia';
import JSON5 from 'json5';
import { type IApplicationState, ApplicationState } from '@/Core';

const DEFAULT_CONFIG = new ApplicationState();

export const useConfigStore = defineStore('configStore', {
    state: () => ({
        configEntries:
            JSON5.parse(localStorage.getItem('configEntries') || 'null') ||
            { default: DEFAULT_CONFIG },
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