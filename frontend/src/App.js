import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import MapRenderer from "./mapRenderer";
import BSP from "./bsp";

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

  const loop = () => {
    // draw();
    window.requestAnimationFrame(loop);
  };

  const draw = () => {
    mapRenderer.clearCanvas();
    // mapRenderer.drawVertexes();
    mapRenderer.drawLinedefs();
    mapRenderer.drawPlayer();
    mapRenderer.drawNode(bsp.rootNodeId);
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
      context = canvas.getContext("2d");
      mapRenderer = new MapRenderer(data, canvas);
      mapRenderer.clearCanvas();
      // mapRenderer.drawVertexes();
      mapRenderer.drawLinedefs();
      mapRenderer.drawPlayer();

      bsp = new BSP(data, canvas);
      mapRenderer.drawNode(bsp.rootNodeId);

      bsp.update();

      window.requestAnimationFrame(loop);
      // console.log(data);
    }
  }, [data, loading]);

  return (
    <div className="App">
      <h1>Node.js to React Data Transfer</h1>
      <canvas
        ref={canvasRef}
        width={data.dimensions.width}
        height={data.dimensions.height}
      ></canvas>
    </div>
  );
}

export default App;
