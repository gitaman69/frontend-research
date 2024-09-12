import React, { useState } from 'react';
import axios from 'axios';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Line } from 'react-chartjs-2';

// Register the components and scales
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

function App() {
  const [file, setFile] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [matchingIndices, setMatchingIndices] = useState([]);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post('https://backend-research.vercel.app/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data' 
        }
      });

      setChartData(response.data.chartData);
      setMatchingIndices(response.data.matchingIndices);
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  };

  const formatChartData = () => {
    if (!chartData) return {};

    return {
      labels: chartData.map((point) => point.index),
      datasets: [
        {
          label: 'Values',
          data: chartData.map((point) => point.value),
          borderColor: 'blue',
          fill: false,
          zIndex: 1,
        },
        {
          label: 'Potential Threat Points',
          data: chartData.map((point, idx) =>
            matchingIndices.includes(idx) ? point.value : null
          ),
          borderColor: 'red',
          pointBackgroundColor: 'red',
          pointRadius: 5,
          fill: false,
          zIndex: 2,
        },
      ],
    };
  };

  return (
    <div className="App">
      <h1>Upload CSV and Display Graph</h1>
      <form onSubmit={handleSubmit}>
        <input type="file" onChange={handleFileChange} />
        <button type="submit">Upload and Plot</button>
      </form>

      {chartData && (
        <div>
          <Line
            data={formatChartData()}
            options={{
              scales: {
                x: {
                  title: {
                    display: true,
                    text: 'Row Index',
                  },
                },
                y: {
                  title: {
                    display: true,
                    text: 'Values',
                  },
                },
              },
            }}
          />
          <div>
            <h2>Threat Time:</h2>
            <ul>
              {matchingIndices.map(index => (
                <li key={index}>
                  Time: {index}, Energy Consumption: {chartData[index].value}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
