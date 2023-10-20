import MapRenderer from "./mapRenderer";

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
  }

  update() {
    this.renderBSPNode(this.rootNodeId);
  }

  renderSubSector(subSectorId) {
    const subSector = this.subSectors[subSectorId][0];

    for (let i = 0; i < subSector.segCount; i++) {
      const seg = this.segs[subSector.firstSegId + i][0];
      const mapRenderer = new MapRenderer(this.data, this.canvas, this.keys);

      mapRenderer.drawSeg(seg, subSectorId);
    }
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

    if (isOnBack) {
      this.renderBSPNode(node.backChildId);
      this.renderBSPNode(node.frontChildId);
    } else {
      this.renderBSPNode(node.frontChildId);
      this.renderBSPNode(node.backChildId);
    }
  }

  isOnBackSide(node) {
    const dx = this.player.pos.x - node.xPartition;
    const dy = this.player.pos.y - node.yPartition;
    return dx * node.dyPartition - dy * node.dxPartition <= 0;
  }
}

export default BSP;
