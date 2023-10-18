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

    app.get("/api/data", (req, res) => {
      const data = {
        dimensions: { width: H_WIDTH, height: H_HEIGHT },
        vertexes: { vertexes },
      };
      res.json(data);
    });

    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  }
}

new Start();
