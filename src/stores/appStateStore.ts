import { defineStore } from 'pinia';
import { useConfigStore } from './configStore';
import _ from 'lodash';
import type { IApplicationState } from '@/Core';

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
        setAppState(other: IApplicationState) {
            Object.assign(this.appState, other);
        },
    }
});