import { applyChange, diff, type Diff } from "deep-diff";
import { ApplicationState, type IApplicationState } from "./Core";
import _ from "lodash";

type StateDiff = Diff<any>[];

const DEFAULT_CONFIG = new ApplicationState();

function applyStateDiff(appState: ApplicationState, stateDiff: StateDiff): void {
    stateDiff.forEach(diffEntry => {
        // Append controlnet units to appState instead of overwriting existing
        // units.
        if (_.isEqual(diffEntry.path, ['controlnetUnits']) &&
            diffEntry.kind === 'A') {
            diffEntry.index += appState.controlnetUnits.length;
        }
        applyChange(appState, undefined, diffEntry);
    });
    appState.controlnetUnits = appState.controlnetUnits.filter(u => !!u);
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
    // Remove undefined from conversion.
    return (diff(baseState, appState) || [])
        .filter(diffEntry => !(diffEntry.kind === 'D' && diffEntry.lhs === undefined));
}

export {
    type StateDiff,
    DEFAULT_CONFIG,
    applyStateDiff,
    stateDiffToAppState,
    appStateToStateDiff,
}