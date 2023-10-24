import Player from "./player";

class MapRenderer {
  constructor(data, canvas, keys, player) {
    this.canvas = canvas;
    this.keys = keys;
    this.player = player;
    this.context = canvas.getContext("2d");
    this.dimensions = data.dimensions;
    this.vertexes = data.vertexes.vertexes;
    this.linedefs = data.linedefs.linedefs;
    this.nodes = data.nodes.nodes;
    this.segments = data.segments.segments;
    this.subSectors = data.subSectors.subSectors;
    this.things = data.things.things;

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
        this.context.strokeStyle = "red";
        this.context.lineWidth = 2;
        this.context.stroke();
        this.context.closePath();
      }
    }
  }

  getColor(seed) {
    const rnd = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
    const rng = [100, 256];
    return [rnd(rng[0], rng[1]), rnd(rng[0], rng[1]), rnd(rng[0], rng[1])];
  }

  drawSeg(seg, subSectorId) {
    const shiftY = 55;
    const v1 = this.vertexes[seg.startVertexId];
    const v2 = this.vertexes[seg.endVertexId];

    const x1 = this.remap_x(v1[0]);
    const y1 = this.remap_y(v1[1]) - shiftY;
    const x2 = this.remap_x(v2[0]);
    const y2 = this.remap_y(v2[1]) - shiftY;

    this.context.strokeStyle = "green";
    this.context.lineWidth = 2;
    this.context.beginPath();
    this.context.moveTo(x1, y1);
    this.context.lineTo(x2, y2);
    this.context.stroke();
  }

  drawBbox(bbox, color) {
    const shiftY = 55;

    const x = this.remap_x(bbox.left);
    const y = this.remap_y(bbox.top) - shiftY;
    const width = this.remap_x(bbox.right) - x;
    const height = this.remap_y(bbox.bottom) - y - shiftY;

    this.context.strokeStyle = color;
    this.context.lineWidth = 2;
    this.context.strokeRect(x, y, width, height);
  }

  drawNode(nodeId) {
    const shiftY = 55;

    const node = this.nodes[nodeId][0];
    const bboxFront = {
      top: node.bboxFrontTop,
      bottom: node.bboxFrontBottom,
      left: node.bboxFrontLeft,
      right: node.bboxFrontRight,
    };
    const bboxBack = {
      top: node.bboxBackTop,
      bottom: node.bboxBackBottom,
      left: node.bboxBackLeft,
      right: node.bboxBackRight,
    };

    this.drawBbox(bboxFront, "green");
    this.drawBbox(bboxBack, "red");

    // Drawing the split line, shows the split between front and back bboxes
    // Example - E1M1: It points down so the front bbox is on the left and the back bbox is on the right
    const x1 = this.remap_x(node.xPartition);
    const y1 = this.remap_y(node.yPartition) - shiftY;
    const x2 = this.remap_x(node.xPartition + node.dxPartition);
    const y2 = this.remap_y(node.yPartition + node.dyPartition) - shiftY;

    this.context.beginPath();
    this.context.moveTo(x1, y1);
    this.context.lineTo(x2, y2);
    this.context.strokeStyle = "blue";
    this.context.lineWidth = 4;
    this.context.stroke();
    this.context.closePath();
  }

  drawPlayer() {
    const shiftY = 55;

    const pos = this.player.pos;
    const x = this.remap_x(pos[0]);
    const y = this.remap_y(pos[1]) - shiftY;

    this.drawFOV(x, y);

    this.context.beginPath();
    this.context.arc(x, y, 3, 0, 2 * Math.PI);
    this.context.fillStyle = "orange";
    this.context.fill();
    this.context.closePath();
  }

  degreesToRadians(degrees) {
    const pi = Math.PI;
    return degrees * (pi / 180);
  }

  drawFOV(px, py) {
    const shiftY = 55;

    const FOV = 90.0;
    const HFOV = FOV / 2;
    const x = this.player.pos[0];
    const y = this.player.pos[1];

    const angle = -this.player.angle + 90;
    const sina1 = Math.sin(this.degreesToRadians(angle - HFOV));
    const cosa1 = Math.cos(this.degreesToRadians(angle - HFOV));
    const sina2 = Math.sin(this.degreesToRadians(angle + HFOV));
    const cosa2 = Math.cos(this.degreesToRadians(angle + HFOV));
    const lenRay = this.dimensions.height + 600;
    const x1 = this.remap_x(x + lenRay * sina1);
    const y1 = this.remap_y(y + lenRay * cosa1) - shiftY;
    const x2 = this.remap_x(x + lenRay * sina2);
    const y2 = this.remap_y(y + lenRay * cosa2) - shiftY;

    this.context.beginPath();
    this.context.moveTo(px, py);
    this.context.lineTo(x1, y1);
    this.context.strokeStyle = "orange";
    this.context.lineWidth = 2;
    this.context.stroke();
    this.context.closePath();

    this.context.beginPath();
    this.context.moveTo(px, py);
    this.context.lineTo(x2, y2);
    this.context.strokeStyle = "orange";
    this.context.lineWidth = 2;
    this.context.stroke();
    this.context.closePath();
  }
}

export default MapRenderer;
