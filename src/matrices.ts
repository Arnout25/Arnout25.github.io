

var m4 = {
	identity: function(){
		return [
			1, 0, 0, 0,
			0, 1, 0, 0,
			0, 0, 1, 0,
			0, 0, 0, 1,
		]
	},

	translation: function(tx: number, ty: number, tz: number) {
	  return [
		 1,  0,  0,  0,
		 0,  1,  0,  0,
		 0,  0,  1,  0,
		 tx, ty, tz, 1,
	  ];
	},
   
	xRotation: function(angleInRadians: number) {
	  var c = Math.cos(angleInRadians);
	  var s = Math.sin(angleInRadians);
   
	  return [
		1, 0, 0, 0,
		0, c, s, 0,
		0, -s, c, 0,
		0, 0, 0, 1,
	  ];
	},
   
	yRotation: function(angleInRadians: number) {
	  var c = Math.cos(angleInRadians);
	  var s = Math.sin(angleInRadians);
   
	  return [
		c, 0, -s, 0,
		0, 1, 0, 0,
		s, 0, c, 0,
		0, 0, 0, 1,
	  ];
	},
   
	zRotation: function(angleInRadians: number) {
	  var c = Math.cos(angleInRadians);
	  var s = Math.sin(angleInRadians);
   
	  return [
		 c, s, 0, 0,
		-s, c, 0, 0,
		 0, 0, 1, 0,
		 0, 0, 0, 1,
	  ];
	},
   
	scaling: function(sx: number, sy: number, sz: number) {
	  return [
		sx, 0,  0,  0,
		0, sy,  0,  0,
		0,  0, sz,  0,
		0,  0,  0,  1,
	  ];
	},

	projection: function(fov: number, aspect: number, near: number, far: number){
		let S = 1/Math.tan(fov/2*Math.PI/180)
		return [
			S/aspect, 0, 0, 0,
			0, S, 0, 0,
			0, 0, -far/(far-near), -1,
			0, 0, -far*near/(far-near), 0
		];
		// return [
		// 	S/aspect, 0, 0, 0,
		// 	0, S, 0, 0,
		// 	0, 0, -far/(far-near), -1/(far-near),
		// 	0, 0, -far*near/(far-near), 0
		// ];
	},



	multiply: function(a: number[], b: number[]) {
		var a00 = a[0 * 4 + 0];
		var a01 = a[0 * 4 + 1];
		var a02 = a[0 * 4 + 2];
		var a03 = a[0 * 4 + 3];
		var a10 = a[1 * 4 + 0];
		var a11 = a[1 * 4 + 1];
		var a12 = a[1 * 4 + 2];
		var a13 = a[1 * 4 + 3];
		var a20 = a[2 * 4 + 0];
		var a21 = a[2 * 4 + 1];
		var a22 = a[2 * 4 + 2];
		var a23 = a[2 * 4 + 3];
		var a30 = a[3 * 4 + 0];
		var a31 = a[3 * 4 + 1];
		var a32 = a[3 * 4 + 2];
		var a33 = a[3 * 4 + 3];
		var b00 = b[0 * 4 + 0];
		var b01 = b[0 * 4 + 1];
		var b02 = b[0 * 4 + 2];
		var b03 = b[0 * 4 + 3];
		var b10 = b[1 * 4 + 0];
		var b11 = b[1 * 4 + 1];
		var b12 = b[1 * 4 + 2];
		var b13 = b[1 * 4 + 3];
		var b20 = b[2 * 4 + 0];
		var b21 = b[2 * 4 + 1];
		var b22 = b[2 * 4 + 2];
		var b23 = b[2 * 4 + 3];
		var b30 = b[3 * 4 + 0];
		var b31 = b[3 * 4 + 1];
		var b32 = b[3 * 4 + 2];
		var b33 = b[3 * 4 + 3];
	 
		return [
		  a00 * b00 + a01 * b10 + a02 * b20 + a03 * b30,
		  a00 * b01 + a01 * b11 + a02 * b21 + a03 * b31,
		  a00 * b02 + a01 * b12 + a02 * b22 + a03 * b32,
		  a00 * b03 + a01 * b13 + a02 * b23 + a03 * b33,
		  a10 * b00 + a11 * b10 + a12 * b20 + a13 * b30,
		  a10 * b01 + a11 * b11 + a12 * b21 + a13 * b31,
		  a10 * b02 + a11 * b12 + a12 * b22 + a13 * b32,
		  a10 * b03 + a11 * b13 + a12 * b23 + a13 * b33,
		  a20 * b00 + a21 * b10 + a22 * b20 + a23 * b30,
		  a20 * b01 + a21 * b11 + a22 * b21 + a23 * b31,
		  a20 * b02 + a21 * b12 + a22 * b22 + a23 * b32,
		  a20 * b03 + a21 * b13 + a22 * b23 + a23 * b33,
		  a30 * b00 + a31 * b10 + a32 * b20 + a33 * b30,
		  a30 * b01 + a31 * b11 + a32 * b21 + a33 * b31,
		  a30 * b02 + a31 * b12 + a32 * b22 + a33 * b32,
		  a30 * b03 + a31 * b13 + a32 * b23 + a33 * b33,
		];
	  },




	translate: function(m: number[], tx: number, ty: number, tz: number) {
		return m4.multiply(m4.translation(tx, ty, tz), m);
	},
	
	xRotate: function(m: number[], angleInRadians: number) {
		return m4.multiply(m4.xRotation(angleInRadians), m);
	},
	
	yRotate: function(m: number[], angleInRadians: number) {
		return m4.multiply(m4.yRotation(angleInRadians), m);
	},
	
	zRotate: function(m: number[], angleInRadians: number) {
		return m4.multiply(m4.zRotation(angleInRadians), m);
	},
	
	scale: function(m: number[], sx: number, sy: number, sz: number) {
		return m4.multiply(m4.scaling(sx, sy, sz), m);
	},

	project: function(m: number[], fov: number, aspect: number, near: number, far: number) {
		return m4.multiply(m4.projection(fov, aspect, near, far), m);
	},

	onvector: function(m: number[], x: number, y: number, z:number){
		var a00 = m[0 * 4 + 0];
		var a01 = m[0 * 4 + 1];
		var a02 = m[0 * 4 + 2];
		var a03 = m[0 * 4 + 3];
		var a10 = m[1 * 4 + 0];
		var a11 = m[1 * 4 + 1];
		var a12 = m[1 * 4 + 2];
		var a13 = m[1 * 4 + 3];
		var a20 = m[2 * 4 + 0];
		var a21 = m[2 * 4 + 1];
		var a22 = m[2 * 4 + 2];
		var a23 = m[2 * 4 + 3];
		var a30 = m[3 * 4 + 0];
		var a31 = m[3 * 4 + 1];
		var a32 = m[3 * 4 + 2];
		var a33 = m[3 * 4 + 3];
	 
		return [
		  a00 * x + a01 * y + a02 * z + a03 * 1,
		  a10 * x + a11 * y + a12 * z + a13 * 1,
		  a20 * x + a21 * y + a22 * z + a23 * 1,
		  a30 * x + a31 * y + a32 * z + a33 * 1,
		];
	},

	onvectorN: function(m: number[], x: number, y: number, z:number){
		let v = m4.onvector(m, x, y, z);
		return [
			v[0]/v[3], v[1]/v[3], v[2]/v[3]
		];
	}
};


export{m4};