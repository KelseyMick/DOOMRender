const fs = require("fs");
const { Vector2 } = require("three");

class WADReader {
  constructor(path) {
    this.fd = fs.openSync(path, "r"); // Synchronous file reading
    this.initialize();
    this.readVertex = this.readVertex.bind(this); // Bind readVertex to the instance
    this.readLinedef = this.readLinedef.bind(this);
    this.readThing = this.readThing.bind(this);
    this.readSegment = this.readSegment.bind(this);
    this.readSubSector = this.readSubSector.bind(this);
    this.readNode = this.readNode.bind(this);
    this.readSector = this.readSector.bind(this);
    this.readSidedef = this.readSidedef.bind(this);
  }

  async initialize() {
    try {
      this.header = await this.readHeader();
      this.directory = await this.readDirectory();
    } catch (error) {
      console.error("Error:", error);
    }
  }

  async readSector(offset) {
    const floorHeight = await this.read2Bytes(offset);
    const ceilHeight = await this.read2Bytes(offset + 2);
    const floorTexture = await this.readString(offset + 4, 8);
    const ceilTexture = await this.readString(offset + 12, 8);

    const lightLevel = await this.read2Bytes(offset + 20, "H");
    const type = await this.read2Bytes(offset + 22, "H");
    const tag = await this.read2Bytes(offset + 24, "H");
    return {
      floorHeight,
      ceilHeight,
      floorTexture,
      ceilTexture,
      lightLevel,
      type,
      tag,
    };
  }

  async readSidedef(offset) {
    const xOffset = await this.read2Bytes(offset);
    const yOffset = await this.read2Bytes(offset + 2);
    const upperTexture = await this.readString(offset + 4, 8);
    const lowerTexture = await this.readString(offset + 12, 8);
    const middleTexture = await this.readString(offset + 20, 8);
    const sectorId = await this.read2Bytes(offset + 28, "H");
    return {
      xOffset,
      yOffset,
      upperTexture,
      lowerTexture,
      middleTexture,
      sectorId,
      floorHeight: "",
      ceilHeight: "",
      floorTexture: "",
      ceilTexture: "",
      lightLevel: "",
      type: "",
      tag: "",
    };
  }

  async readThing(offset) {
    const x = await this.read2Bytes(offset);
    const y = await this.read2Bytes(offset + 2);

    const angle = await this.read2Bytes(offset + 4);
    const type = await this.read2Bytes(offset + 6);
    const flags = await this.read2Bytes(offset + 8);
    const pos = new Vector2(x, y);
    return { angle, type, flags, pos };
  }

  async readSegment(offset) {
    const startVertexId = await this.read2Bytes(offset);
    const endVertexId = await this.read2Bytes(offset + 2);
    const angle = await this.read2Bytes(offset + 4);
    const linedefId = await this.read2Bytes(offset + 6);
    const direction = await this.read2Bytes(offset + 8);
    const segmentOffset = await this.read2Bytes(offset + 10);
    return [
      {
        startVertexId,
        endVertexId,
        angle,
        linedefId,
        direction,
        segmentOffset,
        startVertex: "",
        endVertex: "",
        linedef: "",
        frontSector: "",
        backSector: "",
      },
    ];
  }

  async readSubSector(offset) {
    const segCount = await this.read2Bytes(offset);
    const firstSegId = await this.read2Bytes(offset + 2);
    return [{ segCount, firstSegId }];
  }

  async readNode(offset) {
    const xPartition = await this.read2Bytes(offset);
    const yPartition = await this.read2Bytes(offset + 2);
    const dxPartition = await this.read2Bytes(offset + 4);
    const dyPartition = await this.read2Bytes(offset + 6);

    const bboxFrontTop = await this.read2Bytes(offset + 8);
    const bboxFrontBottom = await this.read2Bytes(offset + 10);
    const bboxFrontLeft = await this.read2Bytes(offset + 12);
    const bboxFrontRight = await this.read2Bytes(offset + 14);

    const bboxBackTop = await this.read2Bytes(offset + 16);
    const bboxBackBottom = await this.read2Bytes(offset + 18);
    const bboxBackLeft = await this.read2Bytes(offset + 20);
    const bboxBackRight = await this.read2Bytes(offset + 22);

    const frontChildId = await this.read2Bytes(offset + 24, "H");
    const backChildId = await this.read2Bytes(offset + 26, "H");

    return [
      {
        xPartition,
        yPartition,
        dxPartition,
        dyPartition,
        bboxFrontTop,
        bboxFrontBottom,
        bboxFrontLeft,
        bboxFrontRight,
        bboxBackTop,
        bboxBackBottom,
        bboxBackLeft,
        bboxBackRight,
        frontChildId,
        backChildId,
      },
    ];
  }

  async readVertex(offset) {
    const x = await this.read2Bytes(offset);
    const y = await this.read2Bytes(offset + 2);
    // console.log(`Read Vertex at offset ${offset}: x=${x}, y=${y}`);
    const vertexes = new Vector2(x, y);
    return [vertexes.x, vertexes.y];
  }

  async readLinedef(offset) {
    const startVertexId = await this.read2Bytes(offset, "H");
    const endVertexId = await this.read2Bytes(offset + 2, "H");
    const flags = await this.read2Bytes(offset + 4, "H");
    const lineType = await this.read2Bytes(offset + 6, "H");
    const sectorTag = await this.read2Bytes(offset + 8, "H");
    const frontSidedefId = await this.read2Bytes(offset + 10, "H");
    const backSidedefId = await this.read2Bytes(offset + 12, "H");

    return [
      {
        startVertexId,
        endVertexId,
        flags,
        lineType,
        sectorTag,
        frontSidedefId,
        backSidedefId,
        frontSidedef: "",
        backSidedef: "",
      },
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

  async read2Bytes(offset, byteFormat) {
    const buffer = Buffer.alloc(2);
    fs.readSync(this.fd, buffer, 0, 2, offset);
    if (byteFormat === "H") {
      return buffer.readUInt16LE(0);
    } else {
      return buffer.readInt16LE(0);
    }
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
