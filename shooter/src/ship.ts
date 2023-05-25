import { Model } from './models.js';
import { Bullet } from './bullets.js';

import { Quaternion } from './quaternions.js';
import { Vector3 } from './vectors.js';

function clamp(min:number, v:number, max:number):number{
	return Math.max(min, Math.min(v, max));
}

class Ship{
	model: Model;
	start_position:Vector3;
	start_orientation:Quaternion;
	position: Vector3 = new Vector3(0,0,0);
	orientation: Quaternion = new Quaternion();
	velocity: Vector3 = new Vector3(0,0,0);
	max_thrust = 100;
	forward_thrust = 0; //used for thruster color
	
	pitch_speed = 0;
	roll_speed = 0;
	yaw_speed = 0;

	health = 1;
	death_pause = 5; //seconds between death and respawn
	death_timer = 0;

	spawn_invulnerability = 10; //seconds player is invulnerable on respawn
	spawn_invulnerability_timer = 0;

	bullets:Bullet[] = [];
	bullet_speed = 3000;
	fire_rate = 20;
	fire_cooldown = 0;
	fire_left = true;

	area_boundary = 6000;

	was_alive = true; //used to check moment of death, to add to enemy score
	score = 0;

	constructor(gl:any, model_data:[string,number,number], position:Vector3, orientation:Quaternion){
		let [model_address, model_y_offset, model_scale] = model_data;
		this.model = new Model(gl, model_address, model_y_offset, model_scale);
		this.start_position = position;
		this.start_orientation = orientation;
		this.reset();
	}

	reset(){
		this.position = new Vector3(this.start_position);
		this.orientation = new Quaternion(this.start_orientation);
		this.velocity = new Vector3();
		this.forward_thrust = 0;
		this.bullets = [];
		this.health = 1;
		this.death_timer = 0;
		this.spawn_invulnerability_timer = 0;
		this.was_alive = true;
	}

	update(dt:number, relative_velocity_target:Vector3, shooting:boolean, enemy:Ship){

		if (this.alive()){//let [roll_speed, pitch_speed, yaw_speed] = angular_velocity; //scaled by delta_time!
			
			this.spawn_invulnerability_timer += dt;

			this.orientation.add_euler(this.roll_speed*dt, this.pitch_speed*dt, this.yaw_speed*dt);
	
			let relative_velocity = this.orientation.get_reverse_rotated_vec(this.velocity);
			let new_velocity = new Vector3(relative_velocity);
			//added velocity = clamp(-max_thrust, target_v - current_v, max_thrust);
			let frame_max = this.max_thrust*dt;
	
			this.forward_thrust = relative_velocity_target.get_z();
	
			new_velocity.set_x( relative_velocity.get_x() + 
				clamp(-frame_max, relative_velocity_target.get_x() - relative_velocity.get_x(), frame_max));
			new_velocity.set_y( relative_velocity.get_y() + 
				clamp(-frame_max, relative_velocity_target.get_y() - relative_velocity.get_y(), frame_max));
			new_velocity.set_z( relative_velocity.get_z() + 
				clamp(-frame_max, relative_velocity_target.get_z() - relative_velocity.get_z(), frame_max));
	
			this.velocity = this.orientation.get_rotated_vec(new_velocity);
	
			//this.velocity = this.orientation.get_rotated_vec(relative_velocity);
			this.position.add(this.velocity.get_scaled(dt));
	
			let removing:number[] = [];
			for (let b = 0; b < this.bullets.length; b++){
				let remove = this.bullets[b].move(dt);
				if (remove){
					removing.push(b);
				}
			}
	
			for (let bi = 0; bi < removing.length; bi++){
				this.bullets.splice(removing[bi],1);
			}
	
			if (this.fire_cooldown > 0){
				this.fire_cooldown -= dt;
			}
			if (shooting && this.fire_cooldown <= 0){
				this.fire_cooldown = 1/this.fire_rate;
				let position_offset = new Vector3();
				if (this.fire_left) {position_offset = new Vector3(-2,0,1.3);} //left
				else {position_offset = new Vector3(2,0,1.3);} //right
	
				this.fire_left = !this.fire_left; //alternate between sides
				
				let bullet_velocity = this.orientation.get_rotated_vec(new Vector3(0,0,-this.bullet_speed)); //.get_added(this.velocity);
				let bullet_position = this.position.get_added(this.orientation.get_rotated_vec(position_offset));
	
				this.bullets.push(new Bullet(bullet_position, bullet_velocity));

			}
			
			//check if in game area:
			if (this.position.get_length() > this.area_boundary){
				this.damage(1, false);
			}

		} else {
			if (this.was_alive) {
				this.was_alive = false;
				enemy.add_score();
			}
			this.velocity = new Vector3(0,0,0);
			this.death_timer += dt;
			if (this.death_timer > this.death_pause) {
				this.reset();
				//TODO: add score
			}
		}

		

	}

	check_shot(dt:number, other_bullets:Bullet[]){
		for (let b = 0; b < other_bullets.length; b++){

			if (!other_bullets[b].isused() && this.position.neg().get_added(other_bullets[b].get_pos()).get_length_sq() < 30**2) { //if close enough, iterate over bullet positions

				//iterate over bullet positions:
				let samples = Math.round(other_bullets[b].get_vel().get_length()*dt/2) + 1; //sample every 2 units

				for (let sample_i = 0; sample_i < samples; sample_i++) {
					let pos = other_bullets[b].get_pos().get_added(other_bullets[b].get_vel().get_scaled(dt*sample_i/(samples-1)));
					
					if (this.check_point_inside(pos)){
						this.damage(.2, true);
						other_bullets[b].hit();
						break;
					}
				}
			}
		}
	}

	check_point_inside(point:Vector3):boolean{
		let rel_pos = this.orientation.get_reverse_rotated_vec(  this.position.neg().get_added(point)  );
		rel_pos.set_y(rel_pos.get_y()*3); //scale y dimension to distort distance check. checks ellipsoid of   xz radius 6   and   y radius 2
		return (rel_pos.get_length_sq() < 6**2);
	}

	check_ship_collision(dt:number, other:Ship){

		if (this.alive() && other.alive()){

			let rel_velocity = this.velocity.get_added(other.velocity.neg());
			let samples = rel_velocity.get_length()/4; //sample every 4 units
	
			for (let s = 0; s < samples; s++){
				let sample_position = this.position.get_added(rel_velocity.get_scaled(-dt*s/samples));
				for (let p = 0; p < 5; p++){
					let point = sample_position.get_added(this.orientation.get_rotated_vec(new Vector3(-5+2.5*p, 0, 0)));
					if (other.check_point_inside(point)){
						this.damage(1, true);
						other.damage(1, true);
						break;
					}
				}
			}

		}
	}

	invulnerable():boolean{
		return this.spawn_invulnerability_timer < this.spawn_invulnerability;
	}
	damage(amount:number, allow_invulnerability:boolean){
		if (!allow_invulnerability || !this.invulnerable()) {
			this.health -= amount;
		}
	}
	add_score(){ this.score += 1;}

	get_orientation():Quaternion{ return this.orientation; }
	get_position():Vector3{ return this.position; }
	get_velocity():Vector3{ return this.velocity; }
	get_forward_thrust():number{ return this.forward_thrust; }
	get_model():Model{ return this.model; }
	get_bullets():Bullet[]{return this.bullets;}
	get_bullet_speed():number{return this.bullet_speed;}
	alive():boolean{return this.health > 0.00001;}

}

export{Ship};