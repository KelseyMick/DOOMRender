class Player {
  constructor(data) {
    this.player = data;
    this.thing = data.things[0];
    this.pos = [this.thing.pos.x, this.thing.pos.y];
    this.angle = this.thing.angle;
  }

  update() {
    // Your update logic here
  }
}

export default Player;
