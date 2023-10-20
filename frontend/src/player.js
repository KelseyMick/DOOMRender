class Player {
  constructor(data, keys) {
    this.player = data;
    this.keys = keys;
    this.thing = data.things.things[0];
    this.pos = [this.thing.pos.x, this.thing.pos.y];
    this.angle = this.thing.angle;
    window.requestAnimationFrame(this.control.bind(this));
  }

  control = () => {
    const speed = 0.3;
    const rotSpeed = 1.8;

    if (this.keys.ArrowUp) {
    }
    if (this.keys.ArrowDown) {
    }
    if (this.keys.ArrowRight) {
      this.angle -= rotSpeed;
    }
    if (this.keys.ArrowLeft) {
      this.angle += rotSpeed;
    }

    window.requestAnimationFrame(this.control);
  };
}

export default Player;
