// SmartMeter.js
import React from 'react';
import './SmartMeter.css'; // Add styling for the smart meter

const SmartMeter = ({ value, time }) => {
  return (
    <div className="smart-meter">
      <h3>Smart Meter</h3>
      <div className="meter-display">
        <span>Power Consumption = </span>
        <span className="power-consumption-value">{value} KWH</span> {/* Power consumption value */}
        <br />
        <span className="time-display">Time = {time} hour</span> {/* Time display */}
      </div>
    </div>
  );
};

export default SmartMeter;