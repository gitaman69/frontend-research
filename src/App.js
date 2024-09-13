import './App.css'
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
  const [files, setFiles] = useState([]);
  const [chartsData, setChartsData] = useState([]);

  const handleFileChange = (e) => {
    setFiles([...e.target.files]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    
    // Iterate through selected files and upload each
    const chartDataPromises = Array.from(files).map(async (file) => {
      const fileFormData = new FormData();
      fileFormData.append('file', file);

      try {
        const response = await axios.post('https://backend-research.vercel.app/upload', fileFormData, {
          headers: {
            'Content-Type': 'multipart/form-data' 
          }
        });

        return {
          fileName: file.name,
          chartData: response.data.chartData,
          matchingIndices: response.data.matchingIndices,
        };
      } catch (error) {
        console.error(`Error uploading file ${file.name}:`, error);
        return null;
      }
    });

    // Wait for all file uploads to complete
    const results = await Promise.all(chartDataPromises);
    setChartsData(results.filter(result => result !== null));
  };

  const formatChartData = (chartData, matchingIndices) => {
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
      <h1>Upload CSV and Display Graphs</h1>
      <form onSubmit={handleSubmit}>
        <input type="file" multiple onChange={handleFileChange} />
        <button type="submit">Upload and Plot</button>
      </form>

      <div className="charts-container">
        {chartsData.map((data, index) => (
          <div key={index} className="chart-card">
            <h2>{data.fileName}</h2>
            <Line
              data={formatChartData(data.chartData, data.matchingIndices)}
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
              <h3>Threat Time:</h3>
              <ul>
                {data.matchingIndices.map(idx => (
                  <li key={idx}>
                    Time: {idx}, Energy Consumption: {data.chartData[idx].value}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
