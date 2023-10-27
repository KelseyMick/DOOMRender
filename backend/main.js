const WADData = require("./wadData");
const { H_WIDTH, H_HEIGHT } = require("./settings");

// node main.js
class Start {
  constructor(path = "./file.wad") {
    this.path = path;
    this.onInit();
  }

  async onInit() {
    const express = require("express");
    const cors = require("cors");
    const app = express();
    const port = 3001;

    app.use(cors());

    this.data = new WADData(this.path, "E1M1");
    await this.data.initializeWADData();
    const vertexes = this.data.vertexes;
    const linedefs = this.data.linedefs;
    const nodes = this.data.nodes;
    const subSectors = this.data.subSectors;
    const segments = this.data.segments;
    const things = this.data.things;
    const sectors = this.data.sectors;
    const sidedefs = this.data.sidedefs;
    // console.log(linedefs);

    app.get("/api/data", (req, res) => {
      const data = {
        dimensions: { width: H_WIDTH, height: H_HEIGHT },
        vertexes: { vertexes },
        linedefs: { linedefs },
        nodes: { nodes },
        subSectors: { subSectors },
        segments: { segments },
        things: { things },
        sectors: { sectors },
        sidedefs: { sidedefs },
      };
      res.json(data);
    });

    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  }
}

new Start();
