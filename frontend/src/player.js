class Player {
  constructor(data, keys, bsp) {
    this.player = data;
    this.height = 41;
    this.keys = keys;
    this.thing = data.things.things[0];
    this.pos = [this.thing.pos.x, this.thing.pos.y];
    this.angle = this.thing.angle;
    this.DIAG_MOVE_CORR = 1 / Math.sqrt(2);
    this.bsp = bsp;
    window.requestAnimationFrame(this.control.bind(this));
  }

  control = () => {
    const speed = 4.3;
    const rotSpeed = 1.8;

    if (this.keys.ArrowRight) {
      this.angle -= rotSpeed;
    }
    if (this.keys.ArrowLeft) {
      this.angle += rotSpeed;
    }

    let moveX = 0;
    let moveY = 0;

    if (this.keys.KeyW) {
      moveX += speed * Math.cos((this.angle * Math.PI) / 180);
      moveY += speed * Math.sin((this.angle * Math.PI) / 180);
    }
    if (this.keys.KeyA) {
      moveX += speed * Math.cos(((this.angle + 90) * Math.PI) / 180);
      moveY += speed * Math.sin(((this.angle + 90) * Math.PI) / 180);
    }
    if (this.keys.KeyS) {
      moveX -= speed * Math.cos((this.angle * Math.PI) / 180);
      moveY -= speed * Math.sin((this.angle * Math.PI) / 180);
    }
    if (this.keys.KeyD) {
      moveX += speed * Math.cos(((this.angle - 90) * Math.PI) / 180);
      moveY += speed * Math.sin(((this.angle - 90) * Math.PI) / 180);
    }

    // Apply diagonal movement correction
    if (moveX !== 0 && moveY !== 0) {
      moveX *= this.DIAG_MOVE_CORR;
      moveY *= this.DIAG_MOVE_CORR;
    }

    this.pos[0] += moveX;
    this.pos[1] += moveY;

    this.angle = this.angle % 360;

    this.bsp.updatePlayerPosition(this.pos, this.angle);

    window.requestAnimationFrame(this.control);
  };
}

export default Player;
