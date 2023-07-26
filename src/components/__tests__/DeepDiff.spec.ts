import { diff } from 'deep-diff';
import { describe, it, expect } from 'vitest'
import { ApplicationState } from '../../Core';
import { ControlNetUnit } from '../../ControlNet';

describe('diff', () => {
    it('Should detect value change', () => {
        const base = new ApplicationState();
        const changed = new ApplicationState();
        changed.commonPayload.n_iter = 100;

        expect(diff(base, changed)).toEqual([
            {
                kind: 'E',
                path: ['commonPayload', 'n_iter'],
                lhs: base.commonPayload.n_iter,
                rhs: 100,
            },
        ]);
    });

    it('Should detect array change', () => {
        const base = new ApplicationState();
        base.controlnetUnits = [new ControlNetUnit()];
        const changed = new ApplicationState();
        const changedUnit = new ControlNetUnit();
        changedUnit.pixel_perfect = true;
        changed.controlnetUnits = [changedUnit];

        expect(diff(base, changed)).toEqual([
            {
                kind: 'E',
                path: ['controlnetUnits', 0, 'pixel_perfect'],
                lhs: false,
                rhs: true,
            }
        ]);
    });
});