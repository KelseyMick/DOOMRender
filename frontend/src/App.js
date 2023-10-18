import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import MapRenderer from "./mapRenderer";

function App() {
  const [data, setData] = useState({
    dimensions: { width: 800, height: 600 },
    vertexes: { vertexes: [] },
  });
  const [loading, setLoading] = useState(true);
  const canvasRef = useRef(null);

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
      const canvas = canvasRef.current;
      const mapRenderer = new MapRenderer(data, canvas);
      mapRenderer.clearCanvas();
      mapRenderer.drawVertexes();
      mapRenderer.drawLinedefs();
      mapRenderer.drawPlayer();
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
