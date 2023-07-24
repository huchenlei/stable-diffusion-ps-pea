import { defineStore } from 'pinia';
import { useConfigStore } from './configStore';
import _ from 'lodash';

function getCopyOfDefaultState() {
    return _.cloneDeep(useConfigStore().getCurrentConfig());
}

export const useAppStateStore = defineStore('appState', {
    state: () => ({
        appState: getCopyOfDefaultState()
    }),
    actions: {
        resetToDefault() {
            Object.assign(this.appState, getCopyOfDefaultState());
        },
    }
});