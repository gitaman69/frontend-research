// SmartMeter.js
import React from 'react';
import './SmartMeter.css'; // Add styling for the smart meter

const SmartMeter = ({ value, time }) => {
  return (
    <div className="smart-meter">
      <h3>Smart Meter</h3>
      <div className="meter-display">
        <span className="meter-value">Power Consumption = {value} KWH</span>
        <br />
        <span className="time-display">Time = {time} hour</span> {/* Time display */}
      </div>
    </div>
  );
};

export default SmartMeter;
