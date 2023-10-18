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

    this.reader = new WADReader(path);
    this.mapName = mapName;
    this.initializeWADData();
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
    // console.log("vertexes: ", this.vertexes);
  }

  static printAttrs(obj) {
    console.log();
    for (let attr of Object.keys(obj)) {
      console.log(obj[attr], " ");
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
