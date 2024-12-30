import { Vector3, Box3, BoxGeometry, WireframeGeometry, LineSegments, LineBasicMaterial, Vector4 } from 'three';

class GeneralBB {
    // width, depth, height numbers
    // t Matrix4, the transformation matrix
    constructor(width, height, depth, t, debugColor) {
        let halfDiag = new Vector3(width, height, depth).multiplyScalar(1 / 2)
        // Box3
        this.baseBB = new Box3(halfDiag.clone().negate(), halfDiag.clone())

        // Matrix4
        this.t = t.clone()
        this.inverse_t = this.t.clone()
        this.inverse_t.invert()

        // Box3 Helper to visualize
        // Box3Helper can't be transformed easily, just make our own
        let helperGeometry = new BoxGeometry(width, height, depth);
        let wireframe = new WireframeGeometry(helperGeometry);
        let line = new LineSegments(wireframe, new LineBasicMaterial({
            color: debugColor,
            opacity: 0.5,
            transparent: false
        }));
        line.applyMatrix4(this.t);
        this.helper = line
    }

    // @param {Vector3} point
    containsPoint(point) {
        let p4 = threeToFour(point)
        p4.applyMatrix4(this.inverse_t)
        let p3 = fourToThree(p4)
        return this.baseBB.containsPoint(p3)
    }

    intersectsBox(box) {
        let tBox = new Box3(box.min.clone().applyMatrix4(this.inverse_t), box.max.clone().applyMatrix4(this.inverse_t))
        return this.baseBB.intersectsBox(tBox)
    }
}

function threeToFour(v) {
    return new Vector4(v.x, v.y, v.z, 1)
}

function fourToThree(v) {
    return new Vector3(v.x, v.y, v.z).multiplyScalar(1 / v.w)
}

export {
    GeneralBB
};