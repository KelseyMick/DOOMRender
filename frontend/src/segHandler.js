class SegHandler {
  constructor(data, player, canvas, bsp, viewRenderer) {
    this.MAX_SCALE = 64.0;
    this.MIN_SCALE = 0.00390625;
    this.data = data;
    this.player = player;
    this.bsp = bsp;
    this.viewRenderer = viewRenderer;
    this.dimensions = { width: canvas.width, height: canvas.height };
    this.seg = null;
    this.rwAngle1 = null;
    this.FOV = 90.0;
    this.H_FOV = this.FOV / 2;
    this.H_WIDTH = this.dimensions.width / 2;
    this.H_HEIGHT = this.dimensions.height / 2;
    this.SCREEN_DIST =
      this.H_WIDTH / Math.tan(this.degreesToRadians(this.H_FOV));
    this.xToAngle = this.getXToAngleTable();
  }

  radiansToDegrees(radians) {
    var pi = Math.PI;
    return radians * (180 / pi);
  }

  degreesToRadians(degrees) {
    return degrees * (Math.PI / 180);
  }

  update() {
    this.initScreenRange();
  }

  getXToAngleTable() {
    const xToAngle = [];
    for (let i = 0; i <= this.dimensions.width; i++) {
      const angle = this.radiansToDegrees(
        Math.atan((this.H_WIDTH - i) / this.SCREEN_DIST)
      );
      xToAngle.push(angle);
    }

    return xToAngle;
  }

  scaleFromGlobalAngle(x, rwNormalAngle, rwDistance) {
    const xAngle = this.xToAngle[x];
    const num =
      this.SCREEN_DIST *
      Math.cos(
        this.degreesToRadians(rwNormalAngle - xAngle - this.player.angle)
      );
    const den = rwDistance * Math.cos(this.degreesToRadians(xAngle));

    let scale = num / den;
    scale = Math.min(this.MAX_SCALE, Math.max(this.MIN_SCALE, scale));
    return scale;
  }

  drawSolidWallRange(x1, x2) {
    const seg = this.seg;
    const frontSector = seg.frontSector;
    const line = seg.linedef[0];
    const side = seg.linedef[0].frontSidedef;
    const renderer = this.viewRenderer;

    // Textures
    const wallTexture = seg.linedef[0].frontSidedef.middleTexture;
    const ceilTexture = frontSector.ceilTexture;
    const floorTexture = frontSector.floorTexture;
    const lightLevel = frontSector.lightLevel;

    // calculate the relative plane heights of front sector
    const worldFrontZ1 = frontSector.ceilHeight - this.player.height;
    const worldFrontZ2 = frontSector.floorHeight - this.player.height;

    // check which parts must be rendered
    const bDrawWall = side.middleTexture != "-";
    const bDrawCeil = worldFrontZ1 > 0;
    const bDrawFloor = worldFrontZ2 < 0;

    // calculate the scaling factors of the left and right edges of the wall range
    const rwNormalAngle = seg.angle + 90;
    const offsetAngle = rwNormalAngle - this.rwAngle1;

    const hypotenuse = Math.hypot(
      this.player.pos[0] - seg.startVertex[0],
      this.player.pos[1] - seg.startVertex[1]
    );
    const rwDistance =
      hypotenuse * Math.cos(this.degreesToRadians(offsetAngle));

    const rwScale1 = this.scaleFromGlobalAngle(x1, rwNormalAngle, rwDistance);
    let rwScaleStep;
    if (x1 < x2) {
      const scale2 = this.scaleFromGlobalAngle(x2, rwNormalAngle, rwDistance);
      rwScaleStep = (scale2 - rwScale1) / (x2 - x1);
    } else {
      rwScaleStep = 0;
    }

    // Determine where on the screen the wall is draw
    let wallY1 = this.H_HEIGHT - worldFrontZ1 * rwScale1;
    const wallY1Step = -rwScaleStep * worldFrontZ1;

    let wallY2 = this.H_HEIGHT - worldFrontZ2 * rwScale1;
    const wallY2Step = -rwScaleStep * worldFrontZ2;

    for (let x = x1; x <= x2; x++) {
      const drawWallY1 = wallY1 - 1;
      const drawWallY2 = wallY2;

      // if (bDrawCeil) {
      // }

      if (bDrawWall) {
        const wy1 = parseInt(drawWallY1);
        const wy2 = parseInt(drawWallY2);
        renderer.drawVline(x, wy1, wy2, wallTexture, lightLevel);
      }

      // if(bDrawFloor) {}

      wallY1 += wallY1Step;
      wallY2 += wallY2Step;
    }

    // this.viewRenderer.drawVline(x1, 0, this.dimensions.height);
  }

  initScreenRange() {
    this.screenRange = new Set(
      Array.from({ length: this.dimensions.width }, (_, index) => index)
    );
  }

  clipSolidWalls(xStart, xEnd) {
    if (this.screenRange) {
      let currWall = new Set();
      for (let i = xStart; i < xEnd; i++) {
        currWall.add(i);
      }

      let intersection = new Set(
        [...currWall].filter((x) => this.screenRange.has(x))
      );
      if (intersection.size === currWall.size) {
        this.drawSolidWallRange(xStart, xEnd - 1);
      } else {
        const arr = Array.from(intersection).sort((a, b) => a - b);
        let x = arr[0];
        let x2 = arr[arr.length - 1];
        for (let i = 0; i < arr.length - 1; i++) {
          let x1 = arr[i];
          x2 = arr[i + 1];
          if (x2 - x1 > 1) {
            this.drawSolidWallRange(x, x1);
            x = x2;
          }
        }
        this.drawSolidWallRange(x, x2);
      }

      // Convert sets to arrays for set difference
      const intersectionArray = Array.from(intersection);
      const screenRangeArray = Array.from(this.screenRange);

      // Perform set difference
      this.screenRange = new Set(
        screenRangeArray.filter((x) => !intersectionArray.includes(x))
      );
    } else {
      this.bsp.isTraverseBsp = false;
    }
  }

  classifySegment(segment, x1, x2, rwAngle1) {
    this.seg = segment;
    this.rwAngle1 = rwAngle1;

    // Does not cross a pixel?
    if (x1 === x2) {
      return null;
    }

    const backSector = segment.backSector;
    const frontSector = segment.frontSector;

    // Handle solid walls
    if (!backSector) {
      this.clipSolidWalls(x1, x2);
      return null;
    }
  }
}

export default SegHandler;
