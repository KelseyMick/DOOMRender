String.prototype.hashCode = function () {
  let hash = 0;
  if (this.length === 0) return hash;
  for (let i = 0; i < this.length; i++) {
    const char = this.charCodeAt(i);
    hash = (hash << 5) - hash + char;
  }
  return hash;
};

class ViewRenderer {
  constructor(data, canvas) {
    this.context = canvas.getContext("2d");
    this.colors = {};
  }

  seedRandom(seed) {
    let x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  }

  getColor(tex, lightLevel) {
    const str_light = lightLevel.toString();
    if (!(tex + str_light in this.colors)) {
      const tex_id = tex.toString().hashCode();
      const l = lightLevel / 255;
      this.seedRandom(tex_id);
      const rng = [50, 256];
      const color = [
        Math.floor(Math.random() * (rng[1] - rng[0] + 1) + rng[0]) * l,
        Math.floor(Math.random() * (rng[1] - rng[0] + 1) + rng[0]) * l,
        Math.floor(Math.random() * (rng[1] - rng[0] + 1) + rng[0]) * l,
      ];
      this.colors[tex + str_light] = color;
    }
    return this.colors[tex + str_light];
  }

  drawVline(x, y1, y2, tex, lightLevel) {
    const color = this.getColor(tex, lightLevel);
    if (y1 < y2) {
      this.context.beginPath();
      this.context.strokeStyle = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
      this.context.moveTo(x, y1);
      this.context.lineTo(x, y2);
      this.context.stroke();
    }
  }
}

export default ViewRenderer;
