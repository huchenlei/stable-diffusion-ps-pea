import { defineStore } from 'pinia';
import JSON5 from 'json5';
import type { StateDiff } from '@/Config';
import { toRaw } from 'vue';

async function fetchDefaultConfigs(): Promise<Record<string, StateDiff>> {
    const response = await fetch(`config/huchenlei_configs.json5`);
    return JSON5.parse(await response.text());
}

// There are 3 levels of configs:
// - Default: The base config. All other configs are references of the base config.
// - Base: The alwayson config in generation.
// - Addon: The optional come-and-go config that can be easily modified from run
// to run.
// Base and addon config should all be delta with reference to Default config.
export const useConfigStore = defineStore('configStore', {
    state: () => ({
        configEntries: { default: [] } as Record<string, StateDiff>,
        baseConfigName: 'default',
        toolboxConfigNames: [] as string[],
    }),
    actions: {
        async initializeConfigEntries() {
            const localConfigString = localStorage.getItem('configEntries');

            // First time user. Do extra setups.
            if (!localConfigString || localConfigString === '{}') {
                this.configEntries = await fetchDefaultConfigs();
                this.baseConfigName = 'default';
                this.toolboxConfigNames = Object.keys(this.configEntries).filter(name => name !== this.baseConfigName);

                // Persists all initialized configs.
                this.updateCurrentConfig(this.baseConfigName);
                this.persistConfigEntries();
                this.persistToolbox();

                console.debug("New user config initialization");
            } else {
                this.configEntries = JSON5.parse(localConfigString);
                this.baseConfigName = localStorage.getItem('baseConfig') || 'default';
                this.toolboxConfigNames = JSON5.parse(localStorage.getItem('toolboxConfigs') || '[]');
                console.debug("Normal config initialization");
            }
        },
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
            if (this.configEntries[this.baseConfigName] === undefined) {
                throw `Config ${this.baseConfigName} not found! All configs:\n${Object.keys(this.configEntries)}`;
            }
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