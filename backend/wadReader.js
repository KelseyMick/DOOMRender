const fs = require("fs");
const { Vector2 } = require("three");

class WADReader {
  constructor(path) {
    this.fd = fs.openSync(path, "r"); // Synchronous file reading
    this.initialize();
    this.readVertex = this.readVertex.bind(this); // Bind readVertex to the instance
    this.readLinedef = this.readLinedef.bind(this);
  }

  async initialize() {
    try {
      this.header = await this.readHeader();
      this.directory = await this.readDirectory();
    } catch (error) {
      console.error("Error:", error);
    }
  }

  async readVertex(offset) {
    const x = await this.read2Bytes(offset);
    const y = await this.read2Bytes(offset + 2);
    // console.log(`Read Vertex at offset ${offset}: x=${x}, y=${y}`);
    const vertexes = new Vector2(x, y);
    return [vertexes.x, vertexes.y];
  }

  async readLinedef(offset) {
    const startVertexId = await this.read2Bytes(offset);
    const endVertexId = await this.read2Bytes(offset + 2);
    const flags = await this.read2Bytes(offset + 4);
    const lineType = await this.read2Bytes(offset + 6);
    const sectorTag = await this.read2Bytes(offset + 8);
    const frontSidedefId = await this.read2Bytes(offset + 10);
    const backSidedefId = await this.read2Bytes(offset + 12);

    return [
      startVertexId,
      endVertexId,
      flags,
      lineType,
      sectorTag,
      frontSidedefId,
      backSidedefId
    ];
  }

  async readDirectory() {
    let directory = [];
    const lumpCount = this.header.lumpCount;
    const initOffset = this.header.initOffset;

    for (let i = 0; i < lumpCount; i++) {
      const offset = initOffset + i * 16;
      const lump_offset = await this.read4Bytes(offset);
      const lump_size = await this.read4Bytes(offset + 4);
      const lump_name = await this.readString(offset + 8, 8);

      const lumpInfo = {
        lump_offset,
        lump_size,
        lump_name,
      };

      directory.push(lumpInfo);
    }

    return directory;
  }

  async readHeader() {
    const typePromise = this.readString(0, 4);
    const lumpCountPromise = this.read4Bytes(4);
    const initOffsetPromise = this.read4Bytes(8);

    const [type, lumpCount, initOffset] = await Promise.all([
      typePromise,
      lumpCountPromise,
      initOffsetPromise,
    ]);

    return {
      type,
      lumpCount,
      initOffset,
    };
  }

  async read1Byte(offset) {
    const buffer = Buffer.alloc(1);
    fs.readSync(this.fd, buffer, 0, 1, offset);
    return buffer.readInt8LE(0);
  }

  async read2Bytes(offset) {
    const buffer = Buffer.alloc(2);
    fs.readSync(this.fd, buffer, 0, 2, offset);
    return buffer.readInt16LE(0);
  }

  async read4Bytes(offset) {
    const buffer = Buffer.alloc(4);
    fs.readSync(this.fd, buffer, 0, 4, offset);
    return buffer.readInt32LE(0);
  }

  async readString(offset, numBytes) {
    const buffer = Buffer.alloc(numBytes);
    fs.readSync(this.fd, buffer, 0, numBytes, offset);
    const result = buffer.toString("ascii").replace(/\0/g, "").toUpperCase();
    return result;
  }
}

module.exports = WADReader;
