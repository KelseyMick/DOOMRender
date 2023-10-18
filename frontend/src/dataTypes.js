class Thing {
  constructor(pos, angle, type, flags) {
    this.pos = pos;
    this.angle = angle;
    this.type = type;
    this.flags = flags;
  }
}

class Seg {
  constructor(startVertexId, endVertexId, angle, linedefId, direction, offset) {
    this.startVertexId = startVertexId;
    this.endVertexId = endVertexId;
    this.angle = angle;
    this.linedefId = linedefId;
    this.direction = direction;
    this.offset = offset;
  }
}

class SubSector {
  constructor(segCount, firstSegId) {
    this.segCount = segCount;
    this.firstSegId = firstSegId;
  }
}

class Node {
  constructor() {
    this.x_partition = 0;
    this.y_partition = 0;
    this.dx_partition = 0;
    this.dy_partition = 0;
    this.bbox = {
      front: {
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
      },
      back: {
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
      },
    };
    this.frontChildId = 0;
    this.backChildId = 0;
  }
}

class Linedef {
  constructor(
    startVertexId,
    endVertexId,
    flags,
    lineType,
    sectorTag,
    frontSidedefId,
    backSidedefId
  ) {
    this.startVertexId = startVertexId;
    this.endVertexId = endVertexId;
    this.flags = flags;
    this.lineType = lineType;
    this.sectorTag = sectorTag;
    this.frontSidedefId = frontSidedefId;
    this.backSidedefId = backSidedefId;
  }
}

module.exports = { Linedef, Thing, Seg, SubSector, Node };
