import React from 'react';

function Grid({ board, onCardPlacement, currentPlayerColor }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(11, 40px)', gap: '4px' }}>
      {board.map((row, rowIndex) =>
        row.map((cell, colIndex) => (
          <div
            key={`${rowIndex}-${colIndex}`}
            style={{
              width: '40px',
              height: '40px',
              border: '1px solid black',
              textAlign: 'center',
              lineHeight: '40px',
              cursor: cell.disabled ? 'not-allowed' : 'pointer',
              backgroundColor: cell.condemned
                ? '#2B2B2B'
                : cell.disabled
                ? 'grey'
                : cell.backgroundColor || '#E8E8E8',
              borderRadius: '4px', // Coins arrondis
              color: '#212529', // Couleur du texte en blanc
            }}
            onClick={() => onCardPlacement(rowIndex, colIndex)}
          >
            {cell.value ? `${cell.value}` : ''}
          </div>
        ))
      )}
    </div>
  );
}

export default Grid;
