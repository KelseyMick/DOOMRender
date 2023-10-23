import MapRenderer from "./mapRenderer";
import { Vector2 } from "three";

class BSP {
  constructor(data, canvas, keys) {
    this.SUB_SECTOR_IDENTIFIER = 32768; // 2^15  32768
    this.data = data;
    this.keys = keys;
    this.player = data.things.things[0];
    this.nodes = data.nodes.nodes;
    this.subSectors = data.subSectors.subSectors;
    this.segs = data.segments.segments;
    this.rootNodeId = this.nodes.length - 1;
    this.canvas = canvas;
    this.FOV = 90.0;
    this.H_FOV = this.FOV / 2;
  }

  update() {
    this.renderBSPNode(this.rootNodeId);
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

  renderSubSector(subSectorId) {
    const subSector = this.subSectors[subSectorId][0];

    for (let i = 0; i < subSector.segCount; i++) {
      const seg = this.segs[subSector.firstSegId + i][0];
      const mapRenderer = new MapRenderer(this.data, this.canvas, this.keys);

      mapRenderer.drawSeg(seg, subSectorId);
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
    const absNodeId = nodeId;

    if (absNodeId >= this.SUB_SECTOR_IDENTIFIER) {
      const subSectorId = absNodeId - this.SUB_SECTOR_IDENTIFIER;
      this.renderSubSector(subSectorId);
      return;
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

  isOnBackSide(node) {
    const dx = this.player.pos.x - node.xPartition;
    const dy = this.player.pos.y - node.yPartition;
    return dx * node.dyPartition - dy * node.dxPartition <= 0;
  }
}

export default BSP;
