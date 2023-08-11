import { diff, applyChange, type Diff} from 'deep-diff';
import { describe, it, expect } from 'vitest'
import { ApplicationState } from '../../Core';
import { ControlNetUnit } from '../../ControlNet';
import _ from 'lodash';

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

describe('applyChange', () => {
    it('Should apply array change', () => {
        const newUnit = {
            "batch_images": "",
            "control_mode": 2,
            "enabled": true,
            "guidance_end": 1,
            "guidance_start": 0,
            "input_mode": 0,
            "low_vram": false,
            "model": "control_v11p_sd15_inpaint [ebff9138]",
            "module": "inpaint_only+lama",
            "output_dir": "",
            "pixel_perfect": false,
            "processor_res": 512,
            "resize_mode": 1,
            "threshold_a": 64,
            "threshold_b": 64,
            "weight": 1,
            "linkedLayerName": ""
        };

        const base = new ApplicationState();
        base.controlnetUnits = [new ControlNetUnit()];
        const expected = _.cloneDeep(base);
        expected.controlnetUnits[10] = newUnit as any;
        
        const stateChange = {
            "kind": "A",
            "path": [
                "controlnetUnits"
            ],
            "index": 10,
            "item": {
                "kind": "N",
                "rhs": newUnit,
            }
        } as unknown as Diff<ApplicationState>;

        applyChange(base, undefined, stateChange);
        expect(base).toEqual(expected);
    });
});