"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Quaternion = void 0;
const vectors_js_1 = require("./vectors.js");
// import { Vector3 } from "./vectors"; // use this import statement for testing
class Quaternion {
    constructor(...args) {
        this.w = 1;
        this.x = 0;
        this.y = 0;
        this.z = 0;
        if (args[0] instanceof Quaternion) {
            this.w = args[0].w;
            this.x = args[0].x;
            this.y = args[0].y;
            this.z = args[0].z;
        }
        else if (args.length == 0) {
            this.w = 1;
            this.x = 0;
            this.y = 0;
            this.z = 0;
        }
        else if (args.length == 3 && typeof args[0] == 'number' && typeof args[1] == 'number' && typeof args[2] == 'number') {
            let q = new Quaternion();
            q.set_euler(args[0], args[1], args[2]);
            this.w = q.w;
            this.x = q.x;
            this.y = q.y;
            this.z = q.z;
        }
        else if (typeof args[0] == 'number' && typeof args[1] == 'number' && typeof args[2] == 'number' && typeof args[3] == 'number') {
            this.w = args[0];
            this.x = args[1];
            this.y = args[2];
            this.z = args[3];
        }
    }
    normalize() {
        var size_sq = (this.w ** 2 + this.x ** 2 + this.y ** 2 + this.z ** 2);
        if (Math.abs(size_sq - 1) > .000001) {
            var size = size_sq ** .5;
            this.w /= size;
            this.x /= size;
            this.y /= size;
            this.z /= size;
        }
    }
    get_sum(other) {
        //https://en.wikipedia.org/wiki/Quaternion
        //adds other rotation to this and returns (not litteral sum)
        let w = this.w * other.w - this.x * other.x - this.y * other.y - this.z * other.z;
        let x = this.w * other.x + this.x * other.w + this.y * other.z - this.z * other.y;
        let y = this.w * other.y - this.x * other.z + this.y * other.w + this.z * other.x;
        let z = this.w * other.z + this.x * other.y - this.y * other.x + this.z * other.w;
        let new_q = new Quaternion(w, x, y, z);
        //new_q.normalize();
        return new_q;
    }
    add_euler(roll, pitch, yaw) {
        let euler_q = new Quaternion();
        euler_q.set_euler(roll, pitch, yaw);
        let new_q = this.get_sum(euler_q);
        //let new_q = euler_q.get_sum(this);
        this.w = new_q.w;
        this.x = new_q.x;
        this.y = new_q.y;
        this.z = new_q.z;
    }
    get_euler() {
        //https://en.m.wikipedia.org/wiki/Conversion_between_quaternions_and_Euler_angles
        var roll = Math.atan2(2 * (this.w * this.x + this.y * this.z), 1 - 2 * (this.x ** 2 + this.y ** 2));
        var pitch = Math.asin(2 * (this.w * this.y - this.x * this.z));
        var yaw = Math.atan2(2 * (this.w * this.z + this.x * this.y), 1 - 2 * (this.y ** 2 + this.z ** 2));
        return [roll, pitch, yaw];
    }
    set_euler(roll, pitch, yaw) {
        let cr = Math.cos(roll * 0.5);
        let sr = Math.sin(roll * 0.5);
        let cp = Math.cos(pitch * 0.5);
        let sp = Math.sin(pitch * 0.5);
        let cy = Math.cos(yaw * 0.5);
        let sy = Math.sin(yaw * 0.5);
        this.w = cr * cp * cy + sr * sp * sy;
        this.x = sr * cp * cy - cr * sp * sy;
        this.y = cr * sp * cy + sr * cp * sy;
        this.z = cr * cp * sy - sr * sp * cy;
    }
    get_inv() {
        return (new Quaternion(this.w, -this.x, -this.y, -this.z));
    }
    get_values() {
        return ([this.w, this.x, this.y, this.z]);
    }
    get_rotated_vec(vec) {
        // //https://gamedev.stackexchange.com/questions/28395/rotating-vector3-by-a-quaternion
        // let [vx, vy, vz] = vec;
        // let v = new Quaternion([0,vy,vx,vz]);//new Quaternion([0,vx,vy,vz]);
        // let conj = this.get_inv();
        // let out = this.get_sum(v).get_sum(conj);
        // return [out.x, out.y, out.z];
        let [roll, pitch, yaw] = this.get_euler();
        let [x, y, z] = vec.get_values();
        let x2 = Math.cos(roll) * x - Math.sin(roll) * y;
        let y2 = Math.cos(roll) * y + Math.sin(roll) * x;
        let y3 = Math.cos(pitch) * y2 + Math.sin(pitch) * z;
        let z2 = Math.cos(pitch) * z - Math.sin(pitch) * y2;
        let x3 = Math.cos(yaw) * x2 - Math.sin(yaw) * z2;
        let z3 = Math.cos(yaw) * z2 + Math.sin(yaw) * x2;
        return new vectors_js_1.Vector3(x3, y3, z3);
    }
    get_reverse_rotated_vec(vec) {
        //use on inverse of quaternion to get original vector before rotation
        let [roll, pitch, yaw] = this.get_euler();
        let [x, y, z] = vec.get_values();
        // let x2 = Math.cos(roll)*x + Math.sin(roll)*y;
        // let y2 = Math.cos(roll)*y - Math.sin(roll)*x;
        // let y3 = Math.cos(pitch)*y2 - Math.sin(pitch)*z;
        // let z2 = Math.cos(pitch)*z + Math.sin(pitch)*y2;
        // let x3 = Math.cos(yaw)*x2 + Math.sin(yaw)*z2;
        // let z3 = Math.cos(yaw)*z2 - Math.sin(yaw)*x2;
        let x2 = Math.cos(yaw) * x + Math.sin(yaw) * z;
        let z2 = Math.cos(yaw) * z - Math.sin(yaw) * x;
        let y2 = Math.cos(pitch) * y - Math.sin(pitch) * z2;
        let z3 = Math.cos(pitch) * z2 + Math.sin(pitch) * y;
        let x3 = Math.cos(roll) * x2 + Math.sin(roll) * y2;
        let y3 = Math.cos(roll) * y2 - Math.sin(roll) * x2;
        return new vectors_js_1.Vector3(x3, y3, z3);
    }
}
exports.Quaternion = Quaternion;
