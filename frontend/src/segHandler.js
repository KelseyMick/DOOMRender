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
    this.screenRange = new Set();
    this.FOV = 90.0;
    this.H_FOV = this.FOV / 2;
    this.H_WIDTH = this.dimensions.width / 2;
    this.H_HEIGHT = this.dimensions.height / 2;
    this.SCREEN_DIST =
      this.H_WIDTH / Math.tan(this.degreesToRadians(this.H_FOV));
    this.xToAngle = this.getXToAngleTable();
    this.upperClip = [];
    this.lowerClip = [];
  }

  radiansToDegrees(radians) {
    var pi = Math.PI;
    return radians * (180 / pi);
  }

  degreesToRadians(degrees) {
    return degrees * (Math.PI / 180);
  }

  update() {
    this.initFloorCeilClipHeight();
    this.initScreenRange();
  }

  initFloorCeilClipHeight() {
    this.upperClip = Array(this.dimensions.width).fill(-1);
    this.lowerClip = Array(this.dimensions.width).fill(this.dimensions.height);
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

  drawPortalWallRange(x1, x2) {
    const seg = this.seg;
    const frontSector = seg.frontSector;
    const backSector = seg.backSector;
    const line = seg.linedef[0];
    const side = seg.linedef[0].frontSidedef;
    const renderer = this.viewRenderer;
    // Clipping lists
    const upperClip = this.upperClip;
    const lowerClip = this.lowerClip;

    // Textures
    const upperWallTexture = side.upperTexture;
    const lowerWallTexture = side.lowerTexture;
    const texCeilId = frontSector.ceilTexture;
    const texFloorId = frontSector.floorTexture;
    const lightLevel = frontSector.lightLevel;

    // calculate the relative plane heights of front and back sector
    const worldFrontZ1 = frontSector.ceilHeight - this.player.height;
    const worldBackZ1 = backSector.ceilHeight - this.player.height;
    const worldFrontZ2 = frontSector.floorHeight - this.player.height;
    const worldBackZ2 = backSector.floorHeight - this.player.height;

    let bDrawUpperWall;
    let bDrawCeil;
    let bDrawFloor;
    let bDrawLowerWall;

    // check which parts must be rendered
    if (
      worldFrontZ1 !== worldBackZ1 ||
      frontSector.lightLevel !== backSector.lightLevel ||
      frontSector.ceilTexture !== backSector.ceilTexture
    ) {
      bDrawUpperWall = side.upperTexture !== "-" && worldBackZ1 < worldFrontZ1;
      bDrawCeil = worldFrontZ1 >= 0;
    } else {
      bDrawUpperWall = false;
      bDrawCeil = false;
    }

    if (
      worldFrontZ2 !== worldBackZ2 ||
      frontSector.floorTexture !== backSector.floorTexture ||
      frontSector.lightLevel !== backSector.lightLevel
    ) {
      bDrawLowerWall = side.lowerTexture !== "-" && worldBackZ2 > worldFrontZ2;
      bDrawFloor = worldFrontZ2 <= 0;
    } else {
      bDrawLowerWall = false;
      bDrawFloor = false;
    }

    // If nothing must be renderered, we can skip this seg
    if (!bDrawUpperWall && !bDrawCeil && !bDrawLowerWall && !bDrawFloor) {
      return null;
    }

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
    if (x2 > x1) {
      const scale2 = this.scaleFromGlobalAngle(x2, rwNormalAngle, rwDistance);
      rwScaleStep = (scale2 - rwScale1) / (x2 - x1);
    } else {
      rwScaleStep = 0;
    }

    // The y positions of the top/bottom edges of the wall on the screen
    let wallY1 = this.H_HEIGHT - worldFrontZ1 * rwScale1;
    const wallY1Step = -rwScaleStep * worldFrontZ1;

    let wallY2 = this.H_HEIGHT - worldFrontZ2 * rwScale1;
    const wallY2Step = -rwScaleStep * worldFrontZ2;

    let portalY1;
    let portalY1Step;
    let portalY2;
    let portalY2Step;

    // The y position of the top edge of the portal
    if (bDrawUpperWall) {
      if (worldBackZ1 > worldFrontZ2) {
        portalY1 = this.H_HEIGHT - worldBackZ1 * rwScale1;
        portalY1Step = -rwScaleStep * worldBackZ1;
      } else {
        portalY1 = wallY2;
        portalY1Step = wallY2Step;
      }
    }

    if (bDrawLowerWall) {
      if (worldBackZ2 < worldFrontZ1) {
        portalY2 = this.H_HEIGHT - worldBackZ2 * rwScale1;
        portalY2Step = -rwScaleStep * worldBackZ2;
      } else {
        portalY2 = wallY1;
        portalY2Step = wallY1Step;
      }
    }

    let drawWallY1;
    let drawWallY2;

    // Carry out rendering
    for (let x = x1; x <= x2; x++) {
      drawWallY1 = wallY1 - 1;
      drawWallY2 = wallY2;

      if (bDrawUpperWall) {
        const drawUpperWallY1 = wallY1 - 1;
        const drawUpperWallY2 = portalY1;

        if (bDrawCeil) {
          const cy1 = upperClip[x] + 1;
          const cy2 = parseInt(Math.min(drawWallY1 - 1, lowerClip[x] - 1));
          renderer.drawVline(x, cy1, cy2, texCeilId, lightLevel);
        }

        const wy1 = parseInt(Math.max(drawUpperWallY1, upperClip[x] + 1));
        const wy2 = parseInt(Math.min(drawUpperWallY2, lowerClip[x] - 1));
        renderer.drawVline(x, wy1, wy2, upperWallTexture, lightLevel);

        if (upperClip[x] < wy2) {
          upperClip[x] = wy2;
        }

        portalY1 += portalY1Step;
      }

      if (bDrawCeil) {
        const cy1 = upperClip[x] + 1;
        const cy2 = parseInt(Math.min(drawWallY1 - 1, lowerClip[x] - 1));
        renderer.drawVline(x, cy1, cy2, texCeilId, lightLevel);

        if (upperClip[x] < cy2) {
          upperClip[x] = cy2;
        }
      }

      if (bDrawLowerWall) {
        if (bDrawFloor) {
          const fy1 = parseInt(Math.max(drawWallY2 + 1, upperClip[x] + 1));
          const fy2 = lowerClip[x] - 1;
          renderer.drawVline(x, fy1, fy2, texFloorId, lightLevel);
        }

        const drawLowerWallY1 = portalY2 - 1;
        const drawLowerWallY2 = wallY2;

        const wy1 = parseInt(Math.max(drawLowerWallY1, upperClip[x] + 1));
        const wy2 = parseInt(Math.min(drawLowerWallY2, lowerClip[x] - 1));
        renderer.drawVline(x, wy1, wy2, lowerWallTexture, lightLevel);

        if (lowerClip[x] > wy1) {
          lowerClip[x] = wy1;
        }

        portalY2 += portalY2Step;
      }

      if (bDrawFloor) {
        const fy1 = parseInt(Math.max(drawWallY2 + 1, upperClip[x] + 1));
        const fy2 = lowerClip[x] - 1;
        renderer.drawVline(x, fy1, fy2, texFloorId, lightLevel);

        if (lowerClip[x] > drawWallY2 + 1) {
          lowerClip[x] = fy1;
        }
      }

      wallY1 += wallY1Step;
      wallY2 += wallY2Step;
    }
  }

  drawSolidWallRange(x1, x2) {
    const seg = this.seg;
    const frontSector = seg.frontSector;
    const line = seg.linedef[0];
    const side = seg.linedef[0].frontSidedef;
    const renderer = this.viewRenderer;
    const upperClip = this.upperClip;
    const lowerClip = this.lowerClip;

    // Textures
    const wallTexture = seg.linedef[0].frontSidedef.middleTexture;
    const ceilTexture = frontSector.ceilTexture;
    const floorTexture = frontSector.floorTexture;
    const lightLevel = frontSector.lightLevel;

    // calculate the relative plane heights of front sector
    const worldFrontZ1 = frontSector.ceilHeight - this.player.height;
    const worldFrontZ2 = frontSector.floorHeight - this.player.height;

    // check which parts must be rendered
    const bDrawWall = side.middleTexture !== "-";
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

    // Determine where on the screen the wall is drawn
    let wallY1 = this.H_HEIGHT - worldFrontZ1 * rwScale1;
    const wallY1Step = -rwScaleStep * worldFrontZ1;

    let wallY2 = this.H_HEIGHT - worldFrontZ2 * rwScale1;
    const wallY2Step = -rwScaleStep * worldFrontZ2;

    for (let x = x1; x <= x2; x++) {
      const drawWallY1 = wallY1 - 1;
      const drawWallY2 = wallY2;

      if (bDrawCeil) {
        const cy1 = upperClip[x] + 1;
        const cy2 = parseInt(Math.min(drawWallY1 - 1, lowerClip[x] - 1));
        renderer.drawVline(x, cy1, cy2, ceilTexture, lightLevel);
      }

      if (bDrawWall) {
        const wy1 = parseInt(Math.max(drawWallY1, upperClip[x] + 1));
        const wy2 = parseInt(Math.min(drawWallY2, lowerClip[x] - 1));
        renderer.drawVline(x, wy1, wy2, wallTexture, lightLevel);
      }

      if (bDrawFloor) {
        const fy1 = parseInt(Math.max(drawWallY2 + 1, upperClip[x] + 1));
        const fy2 = lowerClip[x] - 1;
        renderer.drawVline(x, fy1, fy2, floorTexture, lightLevel);
      }

      wallY1 += wallY1Step;
      wallY2 += wallY2Step;
    }
  }

  initScreenRange() {
    this.screenRange = new Set(
      Array.from({ length: this.dimensions.width }, (_, index) => index)
    );
  }

  clipPortalWalls(xStart, xEnd) {
    let currWall = new Set(
      Array.from({ length: xEnd - xStart }, (_, i) => i + xStart)
    );

    let intersection = new Set(
      [...currWall].filter((x) => this.screenRange.has(x))
    );

    if (intersection.size > 0) {
      if (intersection.size === currWall.size) {
        this.drawPortalWallRange(xStart, xEnd - 1);
      } else {
        const arr = Array.from(intersection).sort((a, b) => a - b);
        let x = arr[0];
        for (let i = 1; i < arr.length; i++) {
          let x1 = arr[i - 1];
          let x2 = arr[i];
          if (x2 - x1 > 1) {
            this.drawPortalWallRange(x, x1);
            x = x2;
          }
        }
        this.drawPortalWallRange(x, arr[arr.length - 1]);
      }
    }
  }

  clipSolidWalls(xStart, xEnd) {
    if (this.screenRange) {
      let currWall = new Set(
        Array.from({ length: xEnd - xStart }, (_, i) => i + xStart)
      );

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
    if (backSector === null) {
      this.clipSolidWalls(x1, x2);
      return null;
    }

    // Wall with window
    if (
      frontSector.ceilHeight !== backSector.ceilHeight ||
      frontSector.floorHeight !== backSector.floorHeight
    ) {
      this.clipPortalWalls(x1, x2);
      return null;
    }

    // Reject empty lines used for triggers and special events.
    // Identical floor and ceiling on both sides, identical
    // light levels on both sides, and no middle texture
    if (
      backSector.ceilTexture === frontSector.ceilTexture &&
      backSector.floorTexture === frontSector.floorTexture &&
      backSector.lightLevel === frontSector.lightLevel &&
      this.seg.linedef[0].frontSidedef.middleTexture === "-"
    ) {
      return null;
    }

    // Borders with different light levels and textures
    this.clipPortalWalls(x1, x2);
  }
}

export default SegHandler;
