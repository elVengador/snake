import { detectCollision } from "./physics.utils";

describe('test physics utils', () => { 
    it('should detect collision when there is overlap', () => {
        const thing1 = { x: 0, y: 0, width: 50, height: 50 };
        const thing2 = { x: 30, y: 30, width: 50, height: 50 };

        const result = detectCollision({thing1, thing2});

        expect(result).toBe(true);
    });

    it('should not detect collision when there is no overlap', () => {
        const thing1 = { x: 0, y: 0, width: 50, height: 50 };
        const thing2 = { x: 60, y: 60, width: 50, height: 50 };

        const result = detectCollision({thing1, thing2});

        expect(result).toBe(false);
    });
 })