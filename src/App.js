import React, { useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";

function FlatUnit({ wallMaterial, floorMaterial, layout }) {
  return (
    <>
      <mesh position={[0, -0.5, 0]} receiveShadow>
        <boxGeometry args={[4, 0.1, 4]} />
        <meshStandardMaterial color={floorMaterial} />
      </mesh>

      {layout.map((wall, i) => (
        <mesh key={i} position={wall.position} rotation={wall.rotation}>
          <boxGeometry args={wall.size} />
          <meshStandardMaterial color={wallMaterial} />
        </mesh>
      ))}
    </>
  );
}

export default function App() {
  const [rates, setRates] = useState({
    wall: {
      Economical: { color: "#ffffff", price: 5 },
      Good: { color: "#cccccc", price: 10 },
      Premium: { color: "#999999", price: 20 },
    },
    floor: {
      Economical: { color: "#aaaaaa", price: 15 },
      Good: { color: "#888888", price: 30 },
      Premium: { color: "#555555", price: 50 },
    },
  });

  const [wallCategory, setWallCategory] = useState("Economical");
  const [floorCategory, setFloorCategory] = useState("Economical");
  const [wallFinish, setWallFinish] = useState(rates.wall[wallCategory].color);
  const [floorFinish, setFloorFinish] = useState(rates.floor[floorCategory].color);

  const [layout, setLayout] = useState([
    { position: [0, 0.5, -2], size: [4, 1, 0.1], rotation: [0, 0, 0] },
  ]);

  const wallArea = layout.reduce((sum, wall) => sum + wall.size[0] * wall.size[1], 0);
  const floorArea = 4 * 4;

  const totalCost =
    wallArea * rates.wall[wallCategory].price +
    floorArea * rates.floor[floorCategory].price;

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = new Uint8Array(evt.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const sheet = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);

      const updatedRates = { wall: {}, floor: {} };
      sheet.forEach((row) => {
        if (row.Element === "Wall Finish") {
          updatedRates.wall[row.Category] = {
            price: row.Rate,
            color: rates.wall[row.Category]?.color || "#cccccc",
          };
        } else if (row.Element === "Floor Finish") {
          updatedRates.floor[row.Category] = {
            price: row.Rate,
            color: rates.floor[row.Category]?.color || "#aaaaaa",
          };
        }
      });
      setRates(updatedRates);
    };
    reader.readAsArrayBuffer(file);
  };

  const addWall = () => {
    const newWall = {
      position: [Math.random() * 4 - 2, 0.5, Math.random() * 4 - 2],
      size: [1 + Math.random() * 2, 1, 0.1],
      rotation: [0, Math.random() > 0.5 ? Math.PI / 2 : 0, 0],
    };
    setLayout([...layout, newWall]);
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Buyer Engagement Cost Summary", 10, 10);
    doc.autoTable({
      head: [["Item", "Area (m²)", "Rate (€/m²)", "Cost (€)"]],
      body: [
        [
          "Wall Finish",
          wallArea,
          rates.wall[wallCategory].price,
          wallArea * rates.wall[wallCategory].price,
        ],
        [
          "Floor Finish",
          floorArea,
          rates.floor[floorCategory].price,
          floorArea * rates.floor[floorCategory].price,
        ],
        ["Total", "-", "-", totalCost],
      ],
    });
    doc.save("cost_summary.pdf");
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <h1 className="text-2xl font-bold mb-4">Flat Unit Buyer Demo</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block mb-1 font-semibold">Wall Finish</label>
            <select
              value={wallCategory}
              onChange={(e) => {
                setWallCategory(e.target.value);
                setWallFinish(rates.wall[e.target.value].color);
              }}
              className="w-full p-2 border rounded"
            >
              {Object.keys(rates.wall).map((cat) => (
                <option key={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block mb-1 font-semibold">Floor Finish</label>
            <select
              value={floorCategory}
              onChange={(e) => {
                setFloorCategory(e.target.value);
                setFloorFinish(rates.floor[e.target.value].color);
              }}
              className="w-full p-2 border rounded"
            >
              {Object.keys(rates.floor).map((cat) => (
                <option key={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="p-4 bg-white rounded shadow">
            <h2 className="font-bold mb-2">Cost Breakdown</h2>
            <p>Wall Area: {wallArea.toFixed(2)} m²</p>
            <p>Wall Cost: €{(wallArea * rates.wall[wallCategory].price).toFixed(2)}</p>
            <p>Floor Area: {floorArea.toFixed(2)} m²</p>
            <p>Floor Cost: €{(floorArea * rates.floor[floorCategory].price).toFixed(2)}</p>
            <hr className="my-2" />
            <p className="font-semibold">Total: €{totalCost.toFixed(2)}</p>
            <button
              onClick={exportPDF}
              className="mt-2 bg-blue-600 text-white px-4 py-2 rounded"
            >
              Export PDF
            </button>
          </div>

          <div>
            <label className="block mb-1 font-semibold">Upload Unit Rate Sheet (.xlsx)</label>
            <input
              type="file"
              accept=".xlsx, .xls"
              onChange={handleFileUpload}
              className="w-full border p-2 rounded"
            />
          </div>

          <div>
            <button
              onClick={addWall}
              className="bg-green-600 text-white px-4 py-2 rounded mt-2"
            >
              Add Wall
            </button>
          </div>
        </div>

        <div className="h-96 bg-white rounded shadow">
          <Canvas shadows camera={{ position: [5, 5, 5], fov: 50 }}>
            <ambientLight intensity={0.5} />
            <directionalLight position={[5, 10, 5]} castShadow />
            <OrbitControls />
            <FlatUnit
              wallMaterial={wallFinish}
              floorMaterial={floorFinish}
              layout={layout}
            />
          </Canvas>
        </div>
      </div>
    </div>
  );
}