const WADReader = require("./wadReader");

class WADData {
  constructor(path, mapName) {
    this.LUMP_INDICES = {
      THINGS: 1,
      LINEDEFS: 2,
      SIDEDEFS: 3,
      VERTEXES: 4,
      SEGS: 5,
      SSECTORS: 6,
      NODES: 7,
      SECTORS: 8,
      REJECT: 9,
      BLOCKMAP: 10,
    };

    this.LINEDEF_FLAGS = {
      BLOCKING: 1,
      BLOCK_MONSTERS: 2,
      TWO_SIDED: 4,
      DONT_PEG_TOP: 8,
      DONT_PEG_BOTTOM: 16,
      SECRET: 32,
      SOUND_BLOCK: 64,
      DONT_DRAW: 128,
      MAPPED: 256,
    };

    this.reader = new WADReader(path);
    this.mapName = mapName;
    // this.initializeWADData();
  }

  async initializeWADData() {
    await this.reader.initialize();
    this.mapIndex = await this.getLumpIndex(this.mapName);
    //   console.log(`${this.mapName}_index = ${this.mapIndex}`);

    this.vertexes = await this.getLumpData(
      this.reader.readVertex,
      this.mapIndex + this.LUMP_INDICES.VERTEXES,
      4,
      0
    );
    this.linedefs = await this.getLumpData(
      this.reader.readLinedef,
      this.mapIndex + this.LUMP_INDICES.LINEDEFS,
      14,
      0
    );
    this.nodes = await this.getLumpData(
      this.reader.readNode,
      this.mapIndex + this.LUMP_INDICES.NODES,
      28,
      0
    );
    this.subSectors = await this.getLumpData(
      this.reader.readSubSector,
      this.mapIndex + this.LUMP_INDICES.SSECTORS,
      4,
      0
    );
    this.segments = await this.getLumpData(
      this.reader.readSegment,
      this.mapIndex + this.LUMP_INDICES.SEGS,
      12,
      0
    );
    this.things = await this.getLumpData(
      this.reader.readThing,
      this.mapIndex + this.LUMP_INDICES.THINGS,
      10,
      0
    );
    this.sidedefs = await this.getLumpData(
      this.reader.readSidedef,
      this.mapIndex + this.LUMP_INDICES.SIDEDEFS,
      30,
      0
    );
    this.sectors = await this.getLumpData(
      this.reader.readSector,
      this.mapIndex + this.LUMP_INDICES.SECTORS,
      26,
      0
    );

    this.updateLinedefs();
    this.updateSidedefs();
    this.updateSegs();
  }

  static printAttrs(obj) {
    console.log();
    for (let attr of Object.keys(obj)) {
      console.log(obj[attr], " ");
    }
  }

  async updateSidedefs() {
    for (let sidedef of this.sidedefs) {
      const sectorId = sidedef.sectorId;
      sidedef.sector = this.sectors[sectorId];
    }
  }

  async updateLinedefs() {
    for (let linedef of this.linedefs) {
      const frontSidedefId = linedef[0].frontSidedefId;
      linedef[0].frontSidedef = this.sidedefs[frontSidedefId];

      if (linedef[0].backSidedefId === 0xffff) {
        // undefined sidedef
        linedef[0].backSidedef = null;
      } else {
        linedef[0].backSidedef = this.sidedefs[linedef[0].backSidedefId];
      }
    }
  }

  async updateSegs() {
    for (let segArr of this.segments) {
      const seg = segArr[0];
      const startVertexId = seg.startVertexId;
      const endVertexId = seg.endVertexId;
      const linedefId = seg.linedefId;

      seg.startVertex = this.vertexes[startVertexId];
      seg.endVertex = this.vertexes[endVertexId];
      seg.linedef = this.linedefs[linedefId];

      let frontSidedef;
      let backSidedef;

      if (seg.direction) {
        frontSidedef = seg.linedef[0].backSidedef;
        backSidedef = seg.linedef[0].frontSidedef;
      } else {
        frontSidedef = seg.linedef[0].frontSidedef;
        backSidedef = seg.linedef[0].backSidedef;
      }

      seg.frontSector = frontSidedef.sector;

      if (this.LINEDEF_FLAGS["TWO_SIDED"] && seg.linedef[0].flags) {
        if (backSidedef) {
          seg.backSector = backSidedef.sector;
        } else {
          seg.backSector = null;
        }
      } else {
        seg.backSector = null;
      }

      // Convert angles from BAMS to degrees
      seg.angle = (seg.angle << 16) * 8.38190317e-8;
      if (seg.angle < 0) {
        seg.angle += 360;
      }
    }
  }

  async getLumpData(readerFunc, lumpIndex, numBytes, headerLength) {
    const lumpInfo = this.reader.directory[lumpIndex];
    const count = lumpInfo["lump_size"] / numBytes;
    let data = [];
    for (let i = 0; i < count; i++) {
      const offset = lumpInfo["lump_offset"] + i * numBytes + headerLength;
      const result = await readerFunc(offset);
      data.push(result);
    }
    return data;
  }

  async getLumpIndex(lumpName) {
    try {
      for (const [index, lumpInfo] of this.reader.directory.entries()) {
        if (lumpName === lumpInfo.lump_name) {
          return index;
        }
      }
    } catch (error) {
      console.error("Error:", error);
    }
  }
}

module.exports = WADData;
