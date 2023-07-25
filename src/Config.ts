import { applyChange, diff, type Diff } from "deep-diff";
import { ApplicationState, type IApplicationState } from "./Core";
import _ from "lodash";

type StateDiff = Diff<any>[];

const DEFAULT_CONFIG = new ApplicationState();

function applyStateDiff(appState: ApplicationState, stateDiff: StateDiff): void {
    stateDiff.forEach(diffEntry => {
        applyChange(appState, undefined, diffEntry);
    });
}

function stateDiffToAppState(stateDiff: StateDiff): IApplicationState {
    const appState = _.cloneDeep(DEFAULT_CONFIG);
    applyStateDiff(appState, stateDiff);
    return appState;
}

function appStateToStateDiff(
    appState: IApplicationState,
    baseState: IApplicationState = DEFAULT_CONFIG
): StateDiff {
    return diff(baseState, appState) || [];
}

export {
    type StateDiff,
    applyStateDiff,
    stateDiffToAppState,
    appStateToStateDiff,
}