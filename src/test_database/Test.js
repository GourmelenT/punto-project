import React, { useEffect } from 'react';

const postDataToServer = async () => {
  try {
    // Exemple de données à insérer
    const dataToInsert = {
      players_id : 1, 
      rounds_id : 10, 
      score : '1-3',
      databaseType: 'MySQL', // MySQL, SQLite, MongoDB 
    };

    // Envoi de la requête POST au serveur Express
    const response = await fetch('http://localhost:3453/api/game', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dataToInsert),
    });

    if (!response.ok) {
      throw new Error(`Erreur lors de la requête : ${response.statusText}`);
    }

    const result = await response.json();
    console.log(result);
  } catch (error) {
    console.error('Erreur lors de la requête POST :', error);
  }
};

const Test = () => {
  useEffect(() => {
    postDataToServer();
  }, []);

  return (
    <div>
      <h1>Test de connexion à la base de données</h1>
      <p>Vérifiez la console du navigateur pour les résultats.</p>
    </div>
  );
};

export default Test;