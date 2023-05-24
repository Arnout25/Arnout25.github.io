"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Vector3 = void 0;
class Vector3 {
    constructor(...args) {
        this.x = 0;
        this.y = 0;
        this.z = 0;
        if (args[0] instanceof Vector3) {
            this.x = args[0].x;
            this.y = args[0].y;
            this.z = args[0].z;
        }
        else if (args.length == 0) {
            //initialized values
        }
        else if (args.length == 1 && typeof args[0] == 'number') {
            this.x = args[0];
            this.y = args[0];
            this.z = args[0];
        }
        else if (typeof args[0] == 'number' && typeof args[1] == 'number' && typeof args[2] == 'number') {
            this.x = args[0];
            this.y = args[1];
            this.z = args[2];
        }
    }
    get_x() { return this.x; }
    ;
    get_y() { return this.y; }
    ;
    get_z() { return this.z; }
    ;
    set_x(x) { this.x = x; }
    ;
    set_y(y) { this.y = y; }
    ;
    set_z(z) { this.z = z; }
    ;
    add(other) {
        this.x += other.x;
        this.y += other.y;
        this.z += other.z;
        return this;
    }
    scale(a) {
        this.x *= a;
        this.y *= a;
        this.z *= a;
        return this;
    }
    get_added(other) {
        //doesn't add to original vector
        let v = new Vector3(this);
        return v.add(other);
    }
    neg() {
        return new Vector3(-this.x, -this.y, -this.z);
    }
    get_scaled(a) {
        //doesn't scale original vector
        return new Vector3(this.x * a, this.y * a, this.z * a);
    }
    get_values() {
        return [this.x, this.y, this.z];
    }
    get_length() {
        return (this.x ** 2 + this.y ** 2 + this.z ** 2) ** .5;
    }
    get_length_sq() {
        return (this.x ** 2 + this.y ** 2 + this.z ** 2);
    }
}
exports.Vector3 = Vector3;
