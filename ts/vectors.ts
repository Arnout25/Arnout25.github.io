class Vector3{
	x = 0;
	y = 0;
	z = 0;

	constructor(...args:number[]|Vector3[]){
		if (args[0] instanceof Vector3){
			this.x = args[0].x;
			this.y = args[0].y;
			this.z = args[0].z;
		} else if (args.length == 0){
			//initialized values
		} else if (args.length == 1 && typeof args[0] == 'number'){
			this.x = args[0];
			this.y = args[0];
			this.z = args[0];
		} else if (typeof args[0] == 'number' && typeof args[1] == 'number' && typeof args[2] == 'number'){
			this.x = args[0];
			this.y = args[1];
			this.z = args[2];
		}
	}

	get_x():number{return this.x};
	get_y():number{return this.y};
	get_z():number{return this.z};
	set_x(x:number){this.x = x;};
	set_y(y:number){this.y = y;};
	set_z(z:number){this.z = z;};

	add(other: Vector3): Vector3{
		this.x += other.x;
		this.y += other.y;
		this.z += other.z;

		return this;
	}
	scale(a:number){
		this.x *= a;
		this.y *= a;
		this.z *= a;
		return this;
	}
	get_added(other: Vector3): Vector3{
		//doesn't add to original vector
		let v = new Vector3(this);
		return v.add(other);
	}
	neg(): Vector3{
		return new Vector3(-this.x, -this.y, -this.z);
	}
	get_scaled(a:number){
		//doesn't scale original vector
		return new Vector3(this.x*a, this.y*a, this.z*a);
	}

	get_values(): number[]{
		return [this.x, this.y, this.z];
	}
	get_length():number{
		return (this.x**2+this.y**2+this.z**2)**.5;
	}
	get_length_sq():number{
		return (this.x**2+this.y**2+this.z**2);
	}

}

export{Vector3};