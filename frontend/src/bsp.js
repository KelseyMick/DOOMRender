import MapRenderer from "./mapRenderer";
import { Vector2 } from "three";
import { H_WIDTH } from "./settings";

class BSP {
  constructor(data, canvas, keys, segHandler, map) {
    this.SUB_SECTOR_IDENTIFIER = 32768; // 2^15  32768
    this.data = data;
    this.map = map;
    this.keys = keys;
    this.segHandler = segHandler;
    this.player = data.things.things[0];
    this.nodes = data.nodes.nodes;
    this.subSectors = data.subSectors.subSectors;
    this.segs = data.segments.segments;
    this.rootNodeId = this.nodes.length - 1;
    this.canvas = canvas;
    this.isTraverseBsp = true;
    this.FOV = 90.0;
    this.H_FOV = this.FOV / 2;
    this.H_WIDTH = this.canvas.width / 2;
    this.SCREEN_DIST =
      this.H_WIDTH / Math.tan(this.radiansToDegrees(this.H_FOV));
  }

  update() {
    if (this.segHandler) {
      this.isTraverseBsp = true;
      this.renderBSPNode(this.rootNodeId);
    }
  }

  toggleMap() {
    this.map.showMap = !this.map.showMap;
  }

  getSubSectorHeight() {
    const subSectorId = this.rootNodeId;

    while (!subSectorId >= this.SUB_SECTOR_IDENTIFIER) {
      const node = this.nodes[subSectorId];
      console.log(subSectorId);

      const isOnBack = this.isOnBackSide(node);
      if (isOnBack) {
        subSectorId = this.nodes[subSectorId].backChildId;
      } else {
        subSectorId = this.nodes[subSectorId].frontChildId;
      }
    }

    const subSector = this.subSectors[subSectorId - this.SUB_SECTOR_IDENTIFIER];
    const seg = this.segs[subSector.firstSegId];
    return seg.frontSector.floorHeight;
  }

  updatePlayerPosition(newPos, newAngle) {
    this.player.pos = new Vector2(newPos[0], newPos[1]);
    this.player.angle = newAngle;
    this.update();
  }

  radiansToDegrees(radians) {
    var pi = Math.PI;
    return radians * (180 / pi);
  }

  degreesToRadians(degrees) {
    return degrees * (Math.PI / 180);
  }

  angleToX(angle) {
    let x;
    if (angle > 0) {
      x =
        this.SCREEN_DIST -
        Math.tan(this.degreesToRadians(angle)) * this.H_WIDTH;
    } else {
      x =
        -Math.tan(this.degreesToRadians(angle)) * this.H_WIDTH +
        this.SCREEN_DIST;
    }
    return parseInt(x);
  }

  addSegmentToFov(vertex1, vertex2) {
    vertex1 = new Vector2(vertex1[0], vertex1[1]);
    vertex2 = new Vector2(vertex2[0], vertex2[1]);
    let angle1 = this.pointToAngle(vertex1);
    let angle2 = this.pointToAngle(vertex2);

    const span = this.norm(angle1 - angle2);

    // backface culling
    if (span >= 180.0) {
      return false;
    }

    const rwAngle1 = angle1;

    angle1 -= this.player.angle;
    angle2 -= this.player.angle;

    const span1 = this.norm(angle1 + this.H_FOV);
    if (span1 > this.FOV) {
      if (span1 >= span + this.FOV) {
        return false;
      }
      // handles segment clipping
      angle1 = this.H_FOV;
    }

    const span2 = this.norm(this.H_FOV - angle2);
    if (span2 > this.FOV) {
      if (span2 >= span + this.FOV) {
        return false;
      }
      // handles segment clipping
      angle2 = -this.H_FOV;
    }

    const x1 = this.angleToX(angle1) + 690;
    const x2 = this.angleToX(angle2) + 690;
    return [x1, x2, rwAngle1];
  }

  renderSubSector(subSectorId) {
    const subSector = this.subSectors[subSectorId][0];
    const mapRenderer = new MapRenderer(
      this.data,
      this.canvas,
      this.keys,
      this.segHandler
    );

    for (let i = 0; i < subSector.segCount; i++) {
      const seg = this.segs[subSector.firstSegId + i][0];

      // if (this.addSegmentToFov(seg.startVertex, seg.endVertex)) {
      //   // mapRenderer.drawSeg(seg, subSectorId);
      //   mapRenderer.drawVlines(result[0], result[1], subSectorId);
      // }
      let result = this.addSegmentToFov(seg.startVertex, seg.endVertex);
      // console.log("hello? ", seg.startVertex, seg.endVertex);
      if (result) {
        // mapRenderer.drawSeg(seg, subSectorId);
        // mapRenderer.drawVlines(result[0], result[1], subSectorId);
        this.segHandler.classifySegment(seg, ...result);
        // console.log(this.segHandler);
      }
    }
  }

  norm(angle) {
    angle %= 360;
    return angle + 360 * (angle < 0 ? 1 : 0);
  }

  pointToAngle(vertex) {
    const delta = new Vector2().subVectors(vertex, this.player.pos);
    return this.radiansToDegrees(Math.atan2(delta.y, delta.x));
  }

  checkBBox(bbox) {
    const a = new Vector2(bbox.left, bbox.bottom);
    const b = new Vector2(bbox.left, bbox.top);
    const c = new Vector2(bbox.right, bbox.top);
    const d = new Vector2(bbox.right, bbox.bottom);

    const { x: px, y: py } = this.player.pos;

    let bboxSides;

    if (px < bbox.left) {
      if (py > bbox.top) {
        bboxSides = [
          [b, a],
          [c, b],
        ];
      } else if (py < bbox.bottom) {
        bboxSides = [
          [b, a],
          [a, d],
        ];
      } else {
        bboxSides = [[b, a]];
      }
    } else if (px > bbox.right) {
      if (py > bbox.top) {
        bboxSides = [
          [c, b],
          [d, c],
        ];
      } else if (py < bbox.bottom) {
        bboxSides = [
          [a, d],
          [d, c],
        ];
      } else {
        bboxSides = [[d, c]];
      }
    } else {
      if (py > bbox.top) {
        bboxSides = [[c, b]];
      } else if (py < bbox.bottom) {
        bboxSides = [[a, d]];
      } else {
        return true;
      }
    }

    for (let [v1, v2] of bboxSides) {
      let angle1 = this.pointToAngle(v1);
      let angle2 = this.pointToAngle(v2);

      const span = this.norm(angle1 - angle2);

      angle1 -= this.player.angle;
      const span1 = this.norm(angle1 + this.H_FOV);
      if (span1 > this.FOV) {
        if (span1 >= span + this.FOV) {
          continue;
        }
      }
      return true;
    }

    return false;
  }

  renderBSPNode(nodeId) {
    if (this.isTraverseBsp) {
      const absNodeId = nodeId;

      if (absNodeId >= this.SUB_SECTOR_IDENTIFIER) {
        const subSectorId = absNodeId - this.SUB_SECTOR_IDENTIFIER;
        this.renderSubSector(subSectorId);
        return null;
      }

      const node = this.nodes[absNodeId][0];
      const isOnBack = this.isOnBackSide(node);

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

      if (isOnBack) {
        this.renderBSPNode(node.backChildId);
        if (this.checkBBox(bboxFront)) {
          this.renderBSPNode(node.frontChildId);
        }
      } else {
        this.renderBSPNode(node.frontChildId);
        if (this.checkBBox(bboxBack)) {
          this.renderBSPNode(node.backChildId);
        }
      }
    }
  }

  isOnBackSide(node) {
    const dx = this.player.pos.x - node.xPartition;
    const dy = this.player.pos.y - node.yPartition;
    return dx * node.dyPartition - dy * node.dxPartition <= 0;
  }
}

export default BSP;
