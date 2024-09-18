import './App.css';
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
  const [anomalyData, setAnomalyData] = useState(null);

  const handleFileChange = (e) => {
    setFiles([...e.target.files]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    
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
          matchingValues: response.data.matchingValues,
        };
      } catch (error) {
        console.error(`Error uploading file ${file.name}:`, error);
        return null;
      }
    });

    const results = await Promise.all(chartDataPromises);
    setChartsData(results.filter(result => result !== null));
  };

  const handleAnomalyDetection = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    
    if (files.length > 0) {
      const file = files[0]; // Use the first selected file for anomaly detection
      formData.append('file', file);

      try {
        const response = await axios.post('https://backend-research.vercel.app/detect_anomalies', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });

        setAnomalyData({
          fileName: file.name,
          anomalyIndices: response.data.anomalyIndices,
          anomalies: response.data.anomalies,
          thresholds: response.data.thresholds,
          allValues: response.data.allValues,
        });
      } catch (error) {
        console.error(`Error detecting anomalies in file ${file.name}:`, error);
      }
    }
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
          label: 'Consecutive Matching Values',
          data: chartData.map((point, idx) => {
            return matchingIndices.includes(idx) ? point.value : null;
          }),
          borderColor: 'red',
          pointBackgroundColor: 'red',
          pointRadius: 5,
          fill: false,
          zIndex: 2,
        },
      ],
    };
  };

  const formatAnomalyChartData = (allValues, anomalies, thresholds) => {
    return {
      labels: allValues.map((_, index) => index),
      datasets: [
        {
          label: 'All Values',
          data: allValues,
          borderColor: 'blue',
          fill: false,
          zIndex: 1,
        },
        {
          label: 'Anomalies',
          data: allValues.map((value, idx) => {
            return anomalies.includes(value) ? value : null;
          }),
          borderColor: 'red',
          pointBackgroundColor: 'red',
          pointRadius: 5,
          fill: false,
          zIndex: 2,
        },
        {
          label: 'Upper Threshold',
          data: new Array(allValues.length).fill(thresholds.high),
          borderColor: 'orange',
          borderDash: [5, 5],
          fill: false,
          zIndex: 0,
        },
        {
          label: 'Lower Threshold',
          data: new Array(allValues.length).fill(thresholds.low),
          borderColor: 'orange',
          borderDash: [5, 5],
          fill: false,
          zIndex: 0,
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

      <form onSubmit={handleAnomalyDetection}>
        <button type="submit">Detect Anomalies</button>
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
            <h3>Consecutive Matching Values:</h3>
            <ul>
              {data.matchingIndices.map((idx, i) => (
                <li key={i}>
                  Index: {idx}, Value: {data.matchingValues[i]}
                </li>
              ))}
            </ul>
          </div>
        ))}

        {anomalyData && (
          <div className="chart-card">
            <h2>{anomalyData.fileName} - Anomalies Detected</h2>
            <Line
              data={formatAnomalyChartData(anomalyData.allValues, anomalyData.anomalies, anomalyData.thresholds)}
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
            <h3>Anomalies Detected:</h3>
            <ul>
              {anomalyData.anomalyIndices.map((idx, i) => (
                <li key={i}>
                  Index: {idx}, Value: {anomalyData.anomalies[i]}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
