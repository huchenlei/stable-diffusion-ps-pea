import { defineStore } from 'pinia';
import JSON5 from 'json5';

export const useConfigStore = defineStore('configStore', {
    state: () => ({
        configEntries: JSON5.parse(localStorage.getItem('configEntries') || '{}')
    }),
    actions: {
        createConfigEntry(entry: Record<string, any>) {
            this.configEntries = { ...this.configEntries, ...entry }
            this.persistConfigEntries();
        },
        getConfigEntry(name: string) {
            return this.configEntries[name];
        },
        persistConfigEntries() {
            localStorage.setItem('configEntries', JSON5.stringify(this.configEntries));
        },
        deleteConfigEntry(entryName: string) {
            const { [entryName]: _, ...remainingEntries } = this.configEntries;
            this.configEntries = remainingEntries;
            this.persistConfigEntries();
        },
    },
});
