class MapRenderer {
  constructor(data, canvas) {
    this.canvas = canvas;
    this.context = canvas.getContext("2d");
    this.dimensions = data.dimensions;
    this.vertexes = data.vertexes.vertexes;
    this.linedefs = data.linedefs.linedefs;

    this.x_min = this.x_max = this.y_min = this.y_max = 0;
    this.calculateMapBounds();

    this.remap_x = this.remap_x.bind(this);
    this.remap_y = this.remap_y.bind(this);
  }

  calculateMapBounds() {
    this.x_min = this.x_max = this.vertexes[0][0];
    this.y_min = this.y_max = this.vertexes[0][1];

    for (let vertex of this.vertexes) {
      let [x, y] = vertex;
      this.x_min = Math.min(this.x_min, x);
      this.x_max = Math.max(this.x_max, x);
      this.y_min = Math.min(this.y_min, y);
      this.y_max = Math.max(this.y_max, y);
    }
  }

  remap_x(n, out_min = 30, out_max = this.dimensions.width - 30) {
    return (
      ((Math.max(this.x_min, Math.min(n, this.x_max)) - this.x_min) *
        (out_max - out_min)) /
        (this.x_max - this.x_min) +
      out_min
    );
  }

  remap_y(n, out_min = 30, out_max = this.dimensions.height - 30) {
    return (
      this.dimensions.height -
      ((Math.max(this.y_min, Math.min(n, this.y_max)) - this.y_min) *
        (out_max - out_min)) /
        (this.y_max - this.y_min) +
      out_min
    );
  }

  clearCanvas() {
    this.context.fillStyle = "black";
    this.context.fillRect(0, 0, this.dimensions.width, this.dimensions.height);
  }

  drawVertexes() {
    const shiftY = 55;

    for (let vertex of this.vertexes) {
      let x = this.remap_x(vertex[0]);
      let y = this.remap_y(vertex[1]) - shiftY;

      x = Math.max(4, Math.min(this.dimensions.width - 4, x));
      y = Math.max(4, Math.min(this.dimensions.height - 4, y));

      this.context.beginPath();
      this.context.arc(x, y, 2.5, 0, 2 * Math.PI);
      this.context.fillStyle = "white";
      this.context.fill();
      this.context.closePath();
    }
  }

  drawLinedefs() {
    const shiftY = 55;

    for (let linedef of this.linedefs) {
      const startVertexId = linedef[0];
      const endVertexId = linedef[1];

      if (startVertexId >= 0 && endVertexId >= 0) {
        const p1 = this.vertexes[startVertexId];
        const p2 = this.vertexes[endVertexId];

        const x1 = this.remap_x(p1[0]);
        const y1 = this.remap_y(p1[1]) - shiftY;
        const x2 = this.remap_x(p2[0]);
        const y2 = this.remap_y(p2[1]) - shiftY;

        this.context.beginPath();
        this.context.moveTo(x1, y1);
        this.context.lineTo(x2, y2);
        this.context.strokeStyle = "orange";
        this.context.lineWidth = 2;
        this.context.stroke();
        this.context.closePath();
      }
    }
  }
}

export default MapRenderer;
