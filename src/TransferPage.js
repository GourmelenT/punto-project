import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const TransferPage = () => {

  const navigate = useNavigate();

  const navigateToSettings = () => {
    navigate('/');
  };

  const [result, setResult] = useState('');
  const [sourceDatabase, setSourceDatabase] = useState('');
  const [destinationDatabase, setDestinationDatabase] = useState('');
  const [transferEnabled, setTransferEnabled] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const databases = ['MySQL', 'SQLite', 'MongoDB', 'Neo4j'];

  /**
   * Cette fonction est appelée à chaque fois que la valeur du select de la source change.
   * @param {*} e - L'événement de changement de valeur
   */
  const handleSourceChange = (e) => {
    setSourceDatabase(e.target.value);
    checkTransferEnabled(e.target.value, destinationDatabase);
  };

  /**
   * Cette fonction est appelée à chaque fois que la valeur du select de la destination change.
   * @param {*} e 
   */
  const handleDestinationChange = (e) => {
    setDestinationDatabase(e.target.value);
    checkTransferEnabled(sourceDatabase, e.target.value);
  };

  /**
   * Cette fonction vérifie si le bouton de transfert doit être activé ou non.
   * @param {*} source - La valeur du select de la source
   * @param {*} destination - La valeur du select de la destination
   */
  const checkTransferEnabled = (source, destination) => {
    if (source && destination && source !== destination) {
      setTransferEnabled(true);
      setErrorMessage('');
    } else {
      setTransferEnabled(false);
      if (source === destination) {
        setErrorMessage('Les bases de données source et destination ne peuvent pas être les mêmes.');
      }
    }
  };

  /**
   * Cette fonction est appelée lorsque le bouton de transfert est cliqué.
   */
  const handleTransfer = async () => {
    try {
      const response = await fetch('http://localhost:3453/api/transfer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sourceDatabase, destinationDatabase }),
      });

      if (!response.ok) {
        const result = "Les données ne se sont pas transférées";
        setResult(result);
        throw new Error('Error transferring data');
      } else {
        const result = "Les données se sont bien transférées";
        setResult(result);
      }

    } catch (error) {
      console.error('Transfer error:', error);
    }
  };

  return (
    <div>
      <h1>Transfère de données</h1>
      <label htmlFor="sourceDatabase">Base de données source : </label>
      <select className="form-select" id="sourceDatabase" onChange={handleSourceChange} value={sourceDatabase}>
        <option value="">Sélectionner une base de données</option>
        {databases.map((db) => (
          <option key={db} value={db}>
            {db}
          </option>
        ))}
      </select>

      <br />

      <label htmlFor="destinationDatabase">Base de données destination : </label>
      <select className="form-select" id="destinationDatabase" onChange={handleDestinationChange} value={destinationDatabase}>
        <option value="">Sélectionner une base de données</option>
        {databases.map((db) => (
          <option key={db} value={db}>
            {db}
          </option>
        ))}
      </select>

      <br />

      <button className="btn btn-success" onClick={handleTransfer} disabled={!transferEnabled}>
        Transférer
      </button>

      <button className="btn btn-danger ms-2" onClick={navigateToSettings} >
        Retour
      </button>
      
      <div className='mt-3'>
          {/* Utilisation de la classe 'alert' de Bootstrap pour les messages */}
          {result && (
            <div className={`alert ${result.includes('bien transférées') ? 'alert-success' : 'alert-danger'}`} role="alert">
              {result}
            </div>
          )}

          {/* Utilisation de la classe 'alert' pour afficher le message d'erreur */}
          {errorMessage && <div className="alert alert-danger" role="alert">{errorMessage}</div>}
      </div>
    </div>
  );
};

export default TransferPage;
