class BSP {
  constructor(data) {
    // console.log(data);
    this.data = data;
    this.player = data.things.things[0];
    this.nodes = data.nodes.nodes;
    this.subSectors = data.subSectors.subSectors;
    this.segs = data.segments.segments;
    this.rootNodeId = this.nodes.length - 1;
    // console.log(this.player);
    // this.player = engine.player;
    // this.nodes = engine.wad_data.nodes;
    // this.sub_sectors = engine.wad_data.sub_sectors;
    // this.segs = engine.wad_data.segments;
    // this.root_node_id = this.nodes.length - 1;
  }

  //   update() {
  //     this.renderBSPNode(this.root_node_id);
  //   }

  //   renderSubSector(sub_sector_id) {
  //     const sub_sector = this.sub_sectors[sub_sector_id];

  //     for (let i = 0; i < sub_sector.seg_count; i++) {
  //       const seg = this.segs[sub_sector.first_seg_id + i];
  //       this.engine.map_renderer.drawSeg(seg, sub_sector_id);
  //     }
  //   }

  //   renderBSPNode(node_id) {
  //     if (node_id >= BSP.SUB_SECTOR_IDENTIFIER) {
  //       const sub_sector_id = node_id - BSP.SUB_SECTOR_IDENTIFIER;
  //       this.renderSubSector(sub_sector_id);
  //       return;
  //     }

  //     const node = this.nodes[node_id];
  //     const isOnBack = this.isOnBackSide(node);

  //     if (isOnBack) {
  //       this.renderBSPNode(node.back_child_id);
  //       this.renderBSPNode(node.front_child_id);
  //     } else {
  //       this.renderBSPNode(node.front_child_id);
  //       this.renderBSPNode(node.back_child_id);
  //     }
  //   }

  //   isOnBackSide(node) {
  //     const dx = this.player.pos.x - node.x_partition;
  //     const dy = this.player.pos.y - node.y_partition;
  //     return dx * node.dy_partition - dy * node.dx_partition <= 0;
  //   }
}

// BSP.SUB_SECTOR_IDENTIFIER = 0x8000; // 32768 // 2^15

export default BSP;
