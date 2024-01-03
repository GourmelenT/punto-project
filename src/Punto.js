import 'bootstrap/dist/css/bootstrap.min.css';
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Modal, Button } from 'react-bootstrap'; // Ajout de l'import du Modal et du Button
import { Gear } from 'react-bootstrap-icons';
import Grid from './Grid';

const grid_size = 11;

function Punto() {
    const navigate = useNavigate();

    const navigateToSettings = () => {
      navigate('/settings');
    };

    const [databaseType, setDatabaseType] = useState('');
    const initializeBoard = () => {
      return Array.from({ length: grid_size }, (row, rowIndex) =>
        Array.from({ length: grid_size }, (cell, colIndex) => ({
          value: null,
          color: null,
          disabled: !(rowIndex === 5 && colIndex === 5), // Activer la case (5, 5), désactiver les autres
        }))
      );
    };

    const [strokes, setStrokes] = useState(""); // Coups joués
    
    // Fonction pour mettre à jour les coups joués
    const updateStrokes = (value, color, position) => {
      // Construire la nouvelle valeur des coups joués
      const newStrokes = `[${value}-${color}] - (${position})`;
      
      // Mettre à jour l'état strokes
      setStrokes((prevStrokes) => prevStrokes + (prevStrokes ? ' | ' : '') + newStrokes);
    };
    const [showWinnerModal, setShowWinnerModal] = useState(false);
    const [finalWinner, setFinalWinner] = useState(null);
    const [deleteCards, setDeleteCards] = useState([]);
    const [numberOfPlayers, setNumberOfPlayers] = useState(2);
    const [playerNames, setPlayerNames] = useState(["", ""]);
    const [playerDecks, setPlayerDecks] = useState(Array.from({ length: 4 }, () => []));
    const [gameStarted, setGameStarted] = useState(false);
    const [currentPlayer, setCurrentPlayer] = useState(0);
    const [board, setBoard] = useState(initializeBoard()); // Appeler initializeBoard ici
    const [winner, setWinner] = useState(null);
    const [gameOver, setGameOver] = useState(false);
    const [roundNumber, setRoundNumber] = useState(1);
    const [playerWins, setPlayerWins] = useState(Array.from({ length: 4 }, () => 0));
    const [gameId, setGameId] = useState(null);
    const [playersId, setPlayersId] = useState([]);
    const [final_score, setFinal_score] = useState(null);
    const [settings, setSettings] = useState(false);

    // Ajout de la fonction pour afficher les paramètres
    useEffect(() => {
      if (gameOver && roundNumber < 10) {
        // Met le score à jour constamment 
        const newScore = String(generateScoreString());
        console.log("newScore : ", newScore);
        setFinal_score(newScore);
        updateDataGame(final_score, databaseType);

        setGameStarted(false);
        setCurrentPlayer(0);
        setBoard(initializeBoard()); // Réinitialiser le tableau ici
        setWinner(null);
        setRoundNumber(roundNumber + 1);
        distributeCards();
      }
    }, [gameOver, roundNumber]);

    /**
     * Met à jour le gagnant et le nombre de victoires
     * @param {*} winnerName - Nom du gagnant
     */
    const updateWinner = (winnerName) => {
      setWinner(winnerName);
      setPlayerWins((prevWins) => {
        const newWins = [...prevWins];
        newWins[currentPlayer] += 1;
        return newWins;
      });
    };    

    /**
     * Redémarre le jeu
     */
    const restartGame = () => {
      setCurrentPlayer(0);
      setBoard(initializeBoard()); // Réinitialiser le tableau ici
      setWinner(null);
      setGameOver(true);
      setGameOver(false);
      setRoundNumber(1);
    };

    /**
     * Génère une chaîne de caractères représentant le score de chaque joueur
     * @returns - Chaîne de caractères représentant le score de chaque joueur
     */
    const generateScoreString = () => {
      let scoreString = '(';
    
      for (let i = 0; i < numberOfPlayers; i++) {
        scoreString += calculatePlayerScore(i);
    
        if (i < numberOfPlayers - 1) {
          scoreString += '-';
        }
      }
    
      scoreString += ')';
      return scoreString;
    };

    /**
     * Calcule le score d'un joueur
     * @param {*} playerIndex - Indice du joueur
     * @returns - Score du joueur
     */
    const calculatePlayerScore = (playerIndex) => {
      return playerWins[playerIndex];
    };

    /**
     * Gère le placement de la carte, leur couleur, leur valeur et leur position
     * @param {*} row - Ligne
     * @param {*} col - Colonne
     */
    const handleCardPlacement = (row, col) => {
        if (!gameOver && !board[row][col].disabled) {
          const currentCard = playerDecks[currentPlayer][playerDecks[currentPlayer].length - 1];
          const existingCard = board[row][col];
      
          if (!existingCard.value || (currentCard && currentCard.value > existingCard.value)) {
            const updatedBoard = [...board].map((line, i) =>
              i === row ? line.map((cell, j) => (j === col ? playerDecks[currentPlayer].pop() : cell)) : line
            );
      
            const neighbors = [
              [row - 1, col],
              [row + 1, col],
              [row, col - 1],
              [row, col + 1],
              [row - 1, col - 1], // diagonale supérieure gauche
              [row - 1, col + 1], // diagonale supérieure droite
              [row + 1, col - 1], // diagonale inférieure gauche
              [row + 1, col + 1], // diagonale inférieure droite
            ];
      
            neighbors.forEach(([r, c]) => {
              if (r >= 0 && r < grid_size && c >= 0 && c < grid_size) {
                if (!updatedBoard[r][c].condemned) {
                  updatedBoard[r][c].disabled = false;
                }
              }
            });
      
            // Check for condemnation
            condemnLinesAndColumns(updatedBoard, row, col);
      
            // Set background color
            updatedBoard[row][col].backgroundColor = currentCard.color;
      
            // Check for win conditions
            if (checkWinConditions(updatedBoard, row, col, currentPlayer)) {
              setGameOver(true); // Mettre le jeu en état de terminé
              const winnerName = playerNames[currentPlayer];
              insertDataRounds(winnerName, gameId, databaseType);
              updateWinner(winnerName);

            }else{
              setCurrentPlayer((currentPlayer + 1) % numberOfPlayers);
            }
            
            setBoard(updatedBoard);

            // Mise à jour automatique des coups joués
            const position = `${row},${col}`
            updateStrokes(currentCard.value, currentCard.color, position)      
          }
        }
    };
      
    /**
     * Condamne les lignes et les colonnes
     * @param {*} board_condemn - Tableau du jeu
     * @param {*} row - Ligne
     * @param {*} col - Colonne
     */
    const condemnLinesAndColumns = (board_condemn, row, col) => {
        // Si inférieur à 6, condamner la ligne qui a l'indice row+6 si elle n'est pas déjà condamnée
        if (row < 5 && !board_condemn[row + 6][col].condemned) {
          // Condamner la ligne
          board_condemn[row + 6].forEach(cell => {
            cell.condemned = true;
            cell.disabled = true; // Désactiver la cellule
          });
        }
      
        // Si supérieur à 6, condamner la ligne qui a l'indice row-6 si elle n'est pas déjà condamnée
        if (row > 5 && !board_condemn[row - 6][col].condemned) {
          // Condamner la ligne
          board_condemn[row - 6].forEach(cell => {
            cell.condemned = true;
            cell.disabled = true; // Désactiver la cellule
          });
        }
      
        // Si inférieur à 6, condamner la colonne qui a l'indice col+6 si elle n'est pas déjà condamnée
        if (col < 5 && !board_condemn[row][col + 6].condemned) {
          // Condamner la colonne
          for (let i = 0; i < board_condemn.length; i++) {
            board_condemn[i][col + 6].condemned = true;
            board_condemn[i][col + 6].disabled = true; // Désactiver la cellule
          }
        }
      
        // Si supérieur à 6, condamner la colonne qui a l'indice col-6 si elle n'est pas déjà condamnée
        if (col > 5 && !board_condemn[row][col - 6].condemned) {
          // Condamner la colonne
          for (let i = 0; i < board_condemn.length; i++) {
            board_condemn[i][col - 6].condemned = true;
            board_condemn[i][col - 6].disabled = true; // Désactiver la cellule
          }
        }
    };
    
    /**
     * Vérifie les conditions de victoire 
     * @param {*} board - Tableau du jeu
     * @returns - true si une victoire est trouvée, false sinon
     */
    const checkWinConditions = (board) => {
        const colorToCheck = [];

        for (let i = 0; i < playerDecks[currentPlayer].length; i++) {
          const currentColor = playerDecks[currentPlayer][i].color; // Couleur du joueur actuel
          if (!colorToCheck.includes(currentColor)) {
            colorToCheck.push(currentColor);
          }
        }

        const alignmentSeries = []; // Tableau des séquences d'alignement
        
        /**
         * Vérifie si une séquence d'alignement est trouvée
         * @param {*} sequence - Séquence à vérifier
         * @returns - true si une séquence d'alignement est trouvée, false sinon
         */
        const checkSequence = (sequence) => {
          for (let i = 0; i < colorToCheck.length; i++) {
            let count = 0;
            let alignment = [];
            
            if (numberOfPlayers !== 3 || colorToCheck[i] !== '#CCA647') {
              for (let j = 0; j < sequence.length; j++) {
                if (sequence[j].color === colorToCheck[i]) {
                  count++;
                  alignment.push(sequence[j]);
        
                  if (count >= (numberOfPlayers === 2 ? 5 : 4)) {
                    alignmentSeries.push(alignment.slice()); // Stocker la série d'alignement
                    // Boucle qui met la carte de la 'value' la plus haute de la série 'alignment' dans le tableau 'deleteCards'
                    let tmp = alignment[0].value;
                    for (let k = 0; k < alignment.length; k++) {
                      if (tmp < alignment[k].value) {
                        tmp = alignment[k].value;
                      }
                    }
                    
                    const deleteCardValue = `${tmp}-${alignment[0].color}`;  // Exemple : 9-#AA3F3B

                    setDeleteCards(prevDeleteCards => [...prevDeleteCards, deleteCardValue]);                  

                    return true;
                  }
                } else {
                  count = 0;
                  alignment = [];
                }
              }
            }
          }
          return false;
        };

        // Vérification des lignes
        for (let i = 0; i < board.length; i++) {
          const row = board[i];
          if (checkSequence(row)) {
            return true; // Victoire trouvée dans une ligne
          }
        }
      
        // Vérification des colonnes
        for (let j = 0; j < board[0].length; j++) {
          const column = [];
          for (let i = 0; i < board.length; i++) {
            column.push(board[i][j]);
          }
          if (checkSequence(column)) {
            return true; // Victoire trouvée dans une colonne
          }
        }


        const nb_alignement = numberOfPlayers === 2 ? 5 : 4;

        // Vérification des diagonales
        for (let i = 0; i < board.length; i++) {
          for (let j = 0; j < board[0].length; j++) {
            const diagonal = [];
            const antiDiagonal = [];
            
            for (let k = 0; k < nb_alignement; k++) {
              // Vérification de la diagonale
              if (board[i + k] && board[i + k][j + k]) {
                diagonal.push(board[i + k][j + k]);
              }
        
              // Vérification de l'anti-diagonale
              if (board[i + k] && board[i + k][j - k]) {
                antiDiagonal.push(board[i + k][j - k]);
              }
            }
        
            // Si une séquence gagnante est trouvée dans la diagonale ou l'anti-diagonale, retourner true
            if (diagonal.length === nb_alignement && checkSequence(diagonal)) {
              return true; // Victoire trouvée dans une diagonale
            }
        
            if (antiDiagonal.length === nb_alignement && checkSequence(antiDiagonal)) {
              return true; // Victoire trouvée dans l'anti-diagonale
            }
          }
        }       
    
        // Vérification des séquences d'alignement si le jeu est bloqué
        if (alignmentSeries.length > 0) {
          let maxSum = 0;
          let winningSeries = null;

          alignmentSeries.forEach((series) => {
            const seriesSum = series.reduce((sum, cell) => sum + cell.value, 0);

            if (seriesSum > maxSum) {
              maxSum = seriesSum;
              winningSeries = series;
            }
          });

          console.log('Winning Series:', winningSeries);
          console.log('Total Points:', maxSum);
        }

        return false; // Aucune victoire trouvée
    };

    /**
     * Gère la fin du jeu
     */
    const handleGameEnd = () => {
      const winnerIndex = playerWins.indexOf(Math.max(...playerWins));
      const winnerName = playerNames[winnerIndex];
      setFinalWinner(winnerName);
      setShowWinnerModal(true);
    };   
    
    const handlePlayerNumberChange = (e) => {
        const selectedPlayers = parseInt(e.target.value, 10);
        setNumberOfPlayers(selectedPlayers);
        setPlayerNames(Array.from({
            length: selectedPlayers
        }, () => ''));
        setPlayerDecks(Array.from({
            length: 4
        }, () => []));
        setGameStarted(false);
    };

    /**
     * Gère le changement de nom du joueur
     * @param {*} e - Événement
     * @param {*} index - Indice du joueur
     */
    const handlePlayerNameChange = (e, index) => {
        const newPlayerNames = [...playerNames];
        newPlayerNames[index] = e.target.value;
        setPlayerNames(newPlayerNames);
    };

    /**
     * Mélange un tableau
     * @param {*} array - Tableau à mélanger
     */
    const shuffleArray = (array) => {
        for (let i = array.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [array[i], array[j]] = [array[j], array[i]];
        }
    };
    
    /**
     * Distribue les cartes
     */ 
    const distributeCards = () => {
        const isAllNamesEntered = playerNames.every(name => name.trim() !== '');
        const isDatabaseTypeSelected = databaseType.trim() !== '';
        const copyDeleteCards = [...deleteCards];

        // Tableau des cartes
        const allColors = ['#AA3F3B', '#365B9B', '#5D9157', '#CCA647'];

        let availableColors = [...allColors];

        const playerDecks = [];

        for (let i = 0; i < numberOfPlayers; i++) {
            const cards = [];
            for (let i = 1; i <= 9; i++) {
                for (let j = 0; j < 2; j++) {
                    cards.push(i);
                }
            }

            shuffleArray(cards);

            const deck = [];

            if (numberOfPlayers === 2) {
              const colorSequence = []; // Séquence de 1 et 0

              // Utiliser la séquence de couleurs pour chaque joueur pour deux couleurs
              for (let k = 0; k < 2; k++){
                shuffleArray(cards);
                
                for (let j = 0; j < 18; j++) {
                    colorSequence.push(Math.random() < 0.5 ? 1 : 0);
                }

                for (let j = 0; j < 18; j++) {
                  const newCards = {
                    color: i === 0 ? colorSequence[j] === 1 ? '#AA3F3B' : '#365B9B' : colorSequence[j] === 1 ? '#5D9157' : '#CCA647',
                    value: cards[j],
                  };
                
                  if (copyDeleteCards.length > 0 && newCards.value === parseInt(copyDeleteCards[0].split('-')[0], 10) && newCards.color === copyDeleteCards[0].split('-')[1]) {
                    copyDeleteCards.shift();
                  }else{
                    deck.push(newCards);
                  }
                }
                

                // On vide le tableau de couleur aléatoire pour en créer de nouvel
                colorSequence.splice(0, colorSequence.length);
              }
            } else if (numberOfPlayers === 3) {
                const mainColor = availableColors.shift()
                const secondColor = availableColors[availableColors.length - 1];
                const colorSequence3 = [];
                
                for (let f = 0; f < 18; f++){
                    colorSequence3.push(mainColor);
                }

                for (let h = 0; h < 6; h++){
                    colorSequence3.push(secondColor);
                }

                const new_cards = []
                for (let j = 0; j < 12; j++) {
                    new_cards.push(cards[j]);
                    
                    shuffleArray(cards);

                    for (let k = 0; k < 12; k++) {
                        new_cards.push(cards[k]);
                    }
                }

                shuffleArray(colorSequence3);

                // Utiliser la séquence de couleurs pour chaque joueur
                for (let j = 0; j < 24; j++) {
                    const newCards ={
                        color: colorSequence3.pop(),
                        value: new_cards[j],
                    };
                    
                    if (copyDeleteCards.length > 0 && newCards.value === parseInt(copyDeleteCards[0].split('-')[0], 10) && newCards.color === copyDeleteCards[0].split('-')[1]) {
                      copyDeleteCards.shift();
                    }else{
                      deck.push(newCards);
                    }
                }

                // On vide le tableau de couleur aléatoire pour en créer de nouvel
                colorSequence3.splice(0, colorSequence3.length);

            } else if (numberOfPlayers === 4) {
                const color = availableColors.shift();

                for (let j = 0; j < 18; j++) {
                    const newCards ={
                        color,
                        value: cards.pop()
                    };

                    if (copyDeleteCards.length > 0 && newCards.value === parseInt(copyDeleteCards[0].split('-')[0], 10) && newCards.color === copyDeleteCards[0].split('-')[1]) {
                      copyDeleteCards.shift();
                    }else{
                      deck.push(newCards);
                    }
                }

                
            }

            playerDecks.push(deck);
        }

        const updatedBoard = [...board];

        updatedBoard[Math.floor(grid_size / 2)][Math.floor(grid_size / 2)].disabled = false;

        // Mettre à jour l'état des decks des joueurs après avoir filtré les cartes
        setPlayerDecks(playerDecks.map((deck) => [...deck]));

        setBoard(updatedBoard);

        // Vérifier si tous les noms ont été saisis et le type de base de données a été sélectionné
        if (isAllNamesEntered && isDatabaseTypeSelected) {
            // Continuer avec la distribution des cartes
            setGameStarted(true);
        } else {
            // Afficher un message d'erreur ou prendre toute autre action nécessaire
            alert("Veuillez entrer un nom pour chaque joueur, ou sélectionner un type de base de données");
        } 
    };

    /**
     * Ajout d'un joueur
     */
    const addPlayer = () => {
        if (playerNames.length < 4) {
            setNumberOfPlayers(numberOfPlayers + 1);
            setPlayerNames((prevState) => [...prevState, ""])
            // handlePlayerNumberChange({ target: { value: numberOfPlayers + 1 } });
        }
    };

    /**
     * Retrait d'un joueur
     */
    const removePlayer = () => {
        if (playerNames.length > 2) {
            setNumberOfPlayers(numberOfPlayers - 1);
            const tmpPlayerNames =  [...playerNames];
            tmpPlayerNames.pop();
            setPlayerNames(tmpPlayerNames);
            // handlePlayerNumberChange({ target: { value: numberOfPlayers - 1 } });
        }
    };

    /**
     * Insère les données des tours dans la base de données
     * @param {*} winner_rounds - Gagnant du tour
     * @param {*} game_id - Identifiant du jeu
     * @param {*} databaseType - Type de base de données
     */
    const insertDataRounds = async (winner_rounds, game_id, databaseType) => {
      const dataToInsert = {
        game_id : game_id,
        strokes: strokes,
        winner: winner_rounds,
        databaseType,
      };
    
      try {
        const response = await fetch('http://localhost:3453/api/rounds', {
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
        console.log('Insertion des tours - Réponse du serveur :', result);
    
      } catch (error) {
        console.error('Erreur lors de l\'insertion des données des tours :', error);
      }
    };
    
    /**
     * Met à jour les données du jeu
     * @param {*} newScore - Nouveau score
     * @param {*} databaseType - Type de base de données
     */
    const updateDataGame = async (newScore, databaseType) => {   
      const dataToInsert = {
        score: newScore,
        id_game: gameId,
        winner: finalWinner,
        databaseType,
      };
     
      try {
        const response = await fetch('http://localhost:3453/api/update_score_game', {
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
        console.error('Erreur lors de l\'insertion des données :', error);
      }
    };

    /**
     * Insère les données des joueurs dans la base de données
     * @param {*} playerNames - Noms des joueurs
     * @param {*} databaseType - Type de base de données
     * @returns - null en cas d'erreur
     */
    const insertDataPlayers = async (playerNames, databaseType) => {
      const dataToInsert = {
        player_1: playerNames[0],
        player_2: playerNames[1],
        player_3: playerNames[2],
        player_4: playerNames[3],
        databaseType,
      };
    
      try {
        const response = await fetch('http://localhost:3453/api/players', {
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
        console.log('Insertion des joueurs - Réponse du serveur :', result);

        if (databaseType !== "Neo4j") {
          if (result.insertId) {
            playersId.push(result.insertId); // Stocker l'identifiant du joueur
            console.log("playersId -1 : ", playersId);
            insertDataGame(playersId, databaseType);
          }else{
            console.log("Y a pas de insertId : miskine");
          }
        }else{
          if (result.records[0]._fields[0].identity.low) {
            playersId.push(result.records[0]._fields[0].identity.low); // Stocker l'identifiant du joueur
            console.log("playersId -2 : ", playersId);
            insertDataGame(playersId, databaseType);
          }else{
            console.log("Y a pas de ça ici : miskine");
          }
        }
      } catch (error) {
        console.error('Erreur lors de l\'insertion des données des joueurs :', error);
      }

      return null; // Retourne null en cas d'erreur
    };

    /**
     * Insère les données du jeu dans la base de données
     * @param {*} players - Identifiants des joueurs
     * @param {*} databaseType - Type de base de données
     */
    const insertDataGame = async (players, databaseType) => {
      const dataToInsert = {
        players_id: parseInt(players),
        score: final_score,
        winner: finalWinner,
        databaseType,
      };
    
      try {
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

        switch (databaseType) {
          case 'MySQL':
            if (result.insertId) {
              setGameId(result.insertId); // Stocker l'identifiant du jeu
              console.log("gameId : ", gameId);
            }
            break;
          case 'SQLite':
            if(result.insertId){
              setGameId(result.insertId); // Stocker l'identifiant du jeu
              console.log("gameId : ", gameId);
            }
            break;
          case 'MongoDB':
            if (result._id) {
              setGameId(result._id); // Stocker l'identifiant du jeu
              console.log("gameId : ", gameId);
            }
            break;
          case 'Neo4j':
            if (result.records[0]._fields[0].identity.low) {
              setGameId(result.records[0]._fields[0].identity.low); // Stocker l'identifiant du jeu
              console.log("gameId : ", gameId);
            }
            break;
        }
            
      } catch (error) {
        console.error('Erreur lors de l\'insertion des données :', error);
      }
    };

    /**
     * Démarre le jeu si les conditions sont remplies
     */
    const startGame = () => {
      // Vérifier les conditions avant de démarrer le jeu
      if (!gameStarted && playerNames.slice(0, numberOfPlayers).every(name => name.trim() !== '') && databaseType.trim() !== '') {
        // Vérifier si les noms de joueurs sont uniques
        const uniqueNames = new Set(playerNames.slice(0, numberOfPlayers).map(name => name.trim()));
        
        if (uniqueNames.size === playerNames.slice(0, numberOfPlayers).length) {
          // Les noms de joueurs sont uniques, continuer avec la distribution des cartes
          insertDataPlayers(playerNames.slice(0, numberOfPlayers), databaseType);
          distributeCards();
        } else {
          // Afficher un message d'erreur si les noms de joueurs ne sont pas uniques
          alert("Chaque joueur doit avoir un nom unique.");
        }
      } else {
        // Afficher un message d'erreur si les conditions ne sont pas remplies
        alert("Veuillez remplir tous les noms de joueur et sélectionner une base de données.");
      }
    };

    return (
        <div style={{textAlign: 'center'}}>
          {!gameStarted && (
              <div className="container-sm text-center">
                  <div className="d-flex justify-content-center" style={{ backgroundColor: '#0067C1', width: '30%', margin: '0 auto', paddingTop: '1rem', borderRadius: '1rem' }}>
                    <h2 className="text-center mb-4 text-white">Jeu du Punto</h2>
                  </div>
                  <button className="btn btn-warning my-3" onClick={navigateToSettings}>
                    Transfère des données
                  </button>
                  {playerNames.map((player, index) => 
                    <div key={index} className="mb-4">
                        <input
                            type="text"
                            className="form-control text-center py-2"
                            value={player}
                            onChange={(e) => handlePlayerNameChange(e, index)}
                            placeholder={`Joueur ${index + 1} - Entrez votre prénom`}
                        />
                    </div>
                  )} 
                  <div className='d-flex justify-content-end'>
                    <div className="mb-2">
                        <button className="btn btn-success mr-2 me-1" onClick={addPlayer}>
                            Ajouter un joueur
                        </button>
                        <button className="btn btn-danger ms-1" onClick={removePlayer}>
                            Retirer un joueur
                        </button>
                    </div>
                  </div>

                  <div className='d-flex justify-content-center my-3'>
                    <div className="form-check form-check-inline">
                        <input className="form-check-input" type="radio" name="db" id="mysql" value="MySQL" onChange={(e) => setDatabaseType(e.target.value)} />
                        <label className="form-check-label" htmlFor="mysql">MySQL</label>
                    </div>

                    <div className="form-check form-check-inline">
                        <input className="form-check-input" type="radio" name="db" id="sqlite" value="SQLite" onChange={(e) => setDatabaseType(e.target.value)} />
                        <label className="form-check-label" htmlFor="sqlite">SQLite</label>
                    </div>

                    <div className="form-check form-check-inline">
                        <input className="form-check-input" type="radio" name="db" id="mongodb" value="MongoDB" onChange={(e) => setDatabaseType(e.target.value)} />
                        <label className="form-check-label" htmlFor="mongodb">MongoDB</label>
                    </div>

                    <div className="form-check form-check-inline">
                        <input className="form-check-input" type="radio" name="db" id="neo4j" value="Neo4j" onChange={(e) => setDatabaseType(e.target.value)} />
                        <label className="form-check-label" htmlFor="neo4j">Neo4j</label>
                    </div>
                  </div>

                  <button
                    className="btn btn-primary"
                    style={{ width: '10%' }}
                    onClick={startGame}
                  >
                    Jouer
                  </button>
              </div>
          )}
          {gameStarted && (
            <div>
              <button className='btn btn-success' onClick={() => window.location.reload()}>Arrêter</button>
              <div className='d-flex justify-content-center'>
                {playerNames.map((player, index) => (
                <p key={index} className='bg-warning m-3' style={{ padding: '.5rem 1rem', borderRadius: '.6rem', color: 'white' }}>
                    {player} : {calculatePlayerScore(index)}
                  </p>
                ))}
              </div>
              <div className='mt-2'>
                <div className="d-flex justify-content-center me-4">
                  {playerNames.slice(0, numberOfPlayers).map((player, index) => (
                    <div
                      key={index}
                      className={`flex-fill text-center p-3 ${index === currentPlayer ? 'bg-dark text-white' : 'bg-secondary text-light'}`}
                      style={{ margin: '0 5px', borderRadius: '1rem' }}
                    >
                      <h5>{index === currentPlayer ? `C'est à vous ${player} !` : `${player}`}</h5>
                      <p>Nombre de cartes {playerDecks[index].length}</p>
                      {index === currentPlayer && playerDecks[index].length > 0 && (
                        <div className='d-flex align-items-center justify-content-center'>
                          <span
                            style={{
                              width: '40px',
                              height: '40px',
                              backgroundColor: playerDecks[index][playerDecks[index].length - 1].color,
                              borderRadius: '4px',
                              display: 'flex',
                              justifyContent: 'center',
                              alignItems: 'center',
                              color: '#212529', // Couleur du texte en blanc
                            }}
                          >
                            {playerDecks[index][playerDecks[index].length - 1].value}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                  <div className='d-flex align-items-center justify-content-center ms-4'>
                    <Grid
                      board={board}
                      onCardPlacement={handleCardPlacement}
                      currentPlayerColor={
                        playerDecks[currentPlayer].length > 0 ? playerDecks[currentPlayer][playerDecks[currentPlayer].length - 1].color : null
                      }
                    />
                  </div>    
                  <div className='d-flex flex-column align-items-center ms-3'>
                    <p>Cartes inutilisables</p>
                    <div className='d-flex flex-wrap justify-content-center'>
                      {deleteCards.map((card, index) => (
                        <span
                          key={index}
                          className='m-2'
                          style={{
                            width: '40px',
                            height: '40px',
                            backgroundColor: card.split('-')[1] || '#E8E8E8',
                            borderRadius: '4px',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            color: '#212529', // Couleur du texte en blanc
                          }}
                        >
                          {card.split('-')[0] || ''}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          {gameOver && (
            <div className="text-center mt-3">
              <button className="btn btn-primary" onClick={() => { restartGame(); setGameOver(false); setStrokes("") }}>Rejouer une manche</button>
              <Button variant="danger" className="ms-2" onClick={() => handleGameEnd()}>
                Terminé la partie
              </Button>
            </div>
          )}
          <Modal show={showWinnerModal} onHide={() => setShowWinnerModal(false)} backdrop="static" keyboard={false}>
            <Modal.Header closeButton>
              <Modal.Title>Grand gagnant !</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              {finalWinner && <p><strong style={{ fontSize: '25px' }}>{finalWinner}</strong> remporte la partie !</p>}
            </Modal.Body>
            <Modal.Footer>
              <Button variant="success"  className="me-2" onClick={() => { window.location.reload() }}>
                Terminé
              </Button>
              <Button variant="danger" onClick={() => setShowWinnerModal(false)}>
                Annulé
              </Button>
            </Modal.Footer>
          </Modal>


      </div>
    );
}

export default Punto;