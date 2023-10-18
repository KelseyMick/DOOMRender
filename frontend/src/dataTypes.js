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

module.exports = Linedef;
