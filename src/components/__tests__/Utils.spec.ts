import { cloneNoBlob } from '../../Utils';
import { describe, it, expect } from 'vitest'

describe('cloneNoImage', () => {
    it('should clone normal object', () => {
        const obj = { a: 1, b: 2 };
        const cloned = cloneNoBlob(obj);
        obj.a = 100;
        expect(cloned.a).toBe(1);
        expect(cloned.b).toBe(2);
    });

    it('should not clone image content', () => {
        const obj = { a: 1, b: 'data:image/png;base64,AAAAAA' };
        const cloned = cloneNoBlob(obj);
        obj.a = 100;
        expect(cloned.a).toBe(1);
        expect(cloned.b).toBe(undefined);
    });

    it('should not clone nested image content', () => {
        const obj = { a: 1, b: [{ c: 'data:image/png;base64,AAAAAA' }] };
        const cloned = cloneNoBlob(obj);
        obj.a = 100;
        expect(cloned.a).toBe(1);
        expect(cloned.b[0].c).toBe(undefined);
    });
});