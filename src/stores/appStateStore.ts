import { defineStore } from 'pinia';
import _ from 'lodash';
import type { IApplicationState } from '@/Core';
import { stateDiffToAppState } from '@/Config';
import { useConfigStore } from './configStore';

function getCopyOfDefaultState() {
    return stateDiffToAppState(useConfigStore().getCurrentConfig());
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