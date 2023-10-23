import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import MapRenderer from "./mapRenderer";
import BSP from "./bsp";
import Player from "./player";

function App() {
  const [data, setData] = useState({
    dimensions: { width: 800, height: 600 },
    vertexes: { vertexes: [] },
  });
  const [loading, setLoading] = useState(true);
  const canvasRef = useRef(null);

  var canvas;
  var context;
  var mapRenderer;
  var bsp;
  const frameRate = 60;
  var frameCount = 0;

  const keys = {
    ArrowLeft: false,
    ArrowRight: false,
    KeyW: false,
    KeyA: false,
    KeyS: false,
    KeyD: false,
    anykey: false,
  };

  const keyBoardEvent = (event) => {
    // console.log(event);
    if (keys[event.code] !== undefined) {
      keys[event.code] = event.type === "keydown";
      event.preventDefault();
      event.type === "keydown" && (keys.anykey = true);
    }
  };

  const update = () => {
    context = canvas.getContext("2d");
    if (frameCount % (60 / frameRate) === 0) {
      draw();
    }
    frameCount += 1;
    requestAnimationFrame(update);
  };

  const draw = () => {
    mapRenderer.clearCanvas();
    // Uncomment to show vertices
    // mapRenderer.drawVertexes();
    mapRenderer.drawLinedefs();
    mapRenderer.drawPlayer();
    // Uncomment to show bounding boxes
    // mapRenderer.drawNode(bsp.rootNodeId);
    bsp.update();
  };

  useEffect(() => {
    axios
      .get("http://localhost:3001/api/data")
      .then((response) => {
        setData(response.data);
        setLoading(false);
      })
      .catch((error) => {
        console.error(error);
      });
  }, []);

  useEffect(() => {
    if (!loading) {
      canvas = canvasRef.current;
      window.addEventListener("keydown", keyBoardEvent);
      window.addEventListener("keyup", keyBoardEvent);
      canvas.addEventListener("click", () => requestAnimationFrame(update), {
        once: true,
      });
      context = canvas.getContext("2d");

      bsp = new BSP(data, canvas, keys);
      bsp.update();
      const player = new Player(data, keys, bsp);
      mapRenderer = new MapRenderer(data, canvas, keys, player);
      mapRenderer.clearCanvas();

      window.requestAnimationFrame(update);
    }
  }, [data, loading]);

  return (
    <div className="App">
      <h1>Node.js to React Data Transfer</h1>
      <h3>Use the left and right arrow keys to turn</h3>
      <canvas
        ref={canvasRef}
        width={data.dimensions.width}
        height={data.dimensions.height}
        tabIndex="0"
      ></canvas>
    </div>
  );
}

export default App;
