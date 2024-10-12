// App.js
import './App.css';
import './SmartMeter.css'; // Import SmartMeter CSS
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import SmartMeter from './SmartMeter'; // Import the SmartMeter component

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
  const [plottingData, setPlottingData] = useState(null); 
  const [currentValue, setCurrentValue] = useState(null); // State to hold the current value for the smart meter
  const [currentTime, setCurrentTime] = useState(null); // State to hold the current time
  const [startAnimation, setStartAnimation] = useState(false); 

  const handleFileChange = (e) => {
    setFiles([...e.target.files]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const chartDataPromises = Array.from(files).map(async (file) => {
      const fileFormData = new FormData();
      fileFormData.append('file', file);

      try {
        const response = await axios.post('https://backend-research.vercel.app/upload', fileFormData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
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
    setChartsData(results.filter((result) => result !== null));
    setStartAnimation(true); 
  };

  const handleAnomalyDetection = async (e) => {
    e.preventDefault();
    const formData = new FormData();

    if (files.length > 0) {
      const file = files[0]; 
      formData.append('file', file);

      try {
        const response = await axios.post('https://backend-research.vercel.app/detect_anomalies', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
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

  const startPlottingAnimation = (chartData, matchingIndices) => {
    let currentIndex = 0;
    const totalPoints = chartData.length;

    const plotData = {
      labels: [],
      datasets: [
        {
          label: 'Values',
          data: [],
          borderColor: 'blue',
          fill: false,
        },
        {
          label: 'Consecutive Matching Values',
          data: [],
          borderColor: 'red',
          pointBackgroundColor: 'red',
          pointRadius: 5,
          fill: false,
        },
      ],
    };

    setPlottingData(plotData); 

    const interval = setInterval(() => {
      if (currentIndex < totalPoints) {
        const currentPoint = chartData[currentIndex];
        plotData.labels.push(currentPoint.index);
        plotData.datasets[0].data.push(currentPoint.value);

        // For matching values
        if (matchingIndices.includes(currentIndex)) {
          plotData.datasets[1].data.push(currentPoint.value);
        } else {
          plotData.datasets[1].data.push(null);
        }

        setCurrentValue(currentPoint.value); // Update the current value for the smart meter
        setCurrentTime(currentPoint.index); // Update the current time for the smart meter
        setPlottingData({ ...plotData });
        currentIndex++;
      } else {
        clearInterval(interval); 
      }
    }, 100); // Plot one point every 100ms for smooth animation
  };

  useEffect(() => {
    if (startAnimation && chartsData.length > 0) {
      chartsData.forEach((data) => {
        startPlottingAnimation(data.chartData, data.matchingIndices);
      });
      setStartAnimation(false);
    }
  }, [startAnimation, chartsData]);

  const formatAnomalyChartData = (allValues, anomalies, thresholds) => {
    return {
      labels: allValues.map((_, index) => index),
      datasets: [
        {
          label: 'All Values',
          data: allValues,
          borderColor: 'blue',
          fill: false,
        },
        {
          label: 'Anomalies',
          data: allValues.map((value, idx) => (anomalies.includes(value) ? value : null)),
          borderColor: 'red',
          pointBackgroundColor: 'red',
          pointRadius: 5,
          fill: false,
        },
        {
          label: 'Upper Threshold',
          data: new Array(allValues.length).fill(thresholds.high),
          borderColor: 'orange',
          borderDash: [5, 5],
          fill: false,
        },
        {
          label: 'Lower Threshold',
          data: new Array(allValues.length).fill(thresholds.low),
          borderColor: 'orange',
          borderDash: [5, 5],
          fill: false,
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
            <div className="chart-and-meter">
              <div className="chart">
                {plottingData && (
                  <Line
                    data={plottingData}
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
                      animation: false,
                    }}
                  />
                )}
              </div>
              <SmartMeter value={currentValue} time={currentTime} /> {/* Pass current value and time to SmartMeter */}
            </div>
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
                animation: false,
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
