import React from 'react';
import './GameSetup.css';

function GameSetup({ onStart }) {
  return (
    <div className="setup-container">
      <button className="start-button" onClick={onStart}>
        Start new game
      </button>
    </div>
  );
}

export default GameSetup;