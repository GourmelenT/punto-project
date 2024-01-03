const express = require('express');
const mysql = require('mysql');                   // MySQL
const sqlite3 = require('sqlite3').verbose();     // SQLite
const { MongoClient } = require('mongodb');       // MongoDB
const neo4j = require('neo4j-driver');            // Neo4j
const bodyParser = require('body-parser');
const cors = require('cors'); // Ajout de CORS

const databaseConfig = require('../config/databaseConfig');

const app = express();
const port = 3453;

app.use(bodyParser.json());
app.use(cors());

// MySQL configuration
const mysqlConnection = mysql.createConnection({
  host: databaseConfig.mysql.host,
  user: databaseConfig.mysql.user,
  password: databaseConfig.mysql.password,
  database: databaseConfig.mysql.database,
});

// SQLite configuration
const sqliteConnection = new sqlite3.Database(databaseConfig.sqlite.filename);

// MongoDB configuration
const mongodbConnection = new MongoClient(databaseConfig.mongodb.url);

// Connexion à la base de données MongoDB
async function connectToMongo() {
  try {
    await mongodbConnection.connect();
    console.log('Connecté à la base de données MongoDB');
  } catch (err) {
    res.status(400).send("Assurez-vous d'avoir lancer le serveur MongoDB.");
    console.error('Erreur de connexion à MongoDB :', err);
  }
}

// Conneexion à la base de données Neo4j
const neo4jDriver = neo4j.driver(
  databaseConfig.neo4j.url,
  neo4j.auth.basic(databaseConfig.neo4j.user, databaseConfig.neo4j.password)
);

app.post('/api/insertData', async (req, res) => {
  const { namePlayer } = req.body;
  const sessionNeo4J = neo4jDriver.session();

  try {
    const result = await sessionNeo4J.run(`CREATE (p:Player {name: "${ namePlayer }"}) RETURN p`);

    res.json(result);
  } catch (error) {
    console.error('Erreur lors de l\'insertion des données dans Neo4j :', error);
    res.status(500).send('Erreur lors de l\'insertion des données dans Neo4j.');
  } finally {
    await sessionNeo4J.close();
  }
});

// Endpoint pour l'insertion de données dans la table 'Players'
app.post('/api/players', async (req, res) => {
  const { player_1, player_2, player_3, player_4, databaseType } = req.body;

  try {
    // Utilisez la variable 'databaseType' pour déterminer dans quelle base de données les données doivent être insérées
    switch (databaseType) {
      case 'MySQL':
        const mysqlSql = 'INSERT INTO players (player_1, player_2, player_3, player_4) VALUES (?, ?, ?, ?)';
        const mysqlValues = [player_1, player_2, player_3, player_4];
        mysqlConnection.query(mysqlSql, mysqlValues, (mysqlError, result) => {
          if (mysqlError) {
            console.error('Erreur lors de l\'insertion des données MySQL :', mysqlError);
            res.status(500).send('Erreur lors de l\'insertion des données MySQL.');
            return;
          }

          console.log('Données insérées avec succès dans MySQL');
          res.json({ message: 'Toutes les données MySQL ont été insérées avec succès.', insertId : result.insertId });

        });
        break;

      case 'SQLite':
        const sqliteSql = 'INSERT INTO players (player_1, player_2, player_3, player_4) VALUES (?, ?, ?, ?)';
        const sqliteValues = [player_1, player_2, player_3, player_4];
        sqliteConnection.run(sqliteSql, sqliteValues, function (sqliteError) {
          if (sqliteError) {
            console.error('Erreur lors de l\'insertion des données SQLite :', sqliteError);
            res.status(400).send('Erreur lors de la connexion à SQLite.');
            return;
          }
      
          // Utilisez this.lastID pour récupérer l'ID inséré
          const insertId = this.lastID;
      
          console.log('Données insérées avec succès dans SQLite');
          res.json({ message: 'Toutes les données SQLite ont été insérées avec succès.', insertId });
        });
        break;
        
      case 'MongoDB':
        await connectToMongo();
        const mongodbDb = mongodbConnection.db(databaseConfig.mongodb.database);
        const mongodbCollection = mongodbDb.collection('Players');
        const mongodbDocument = { player_1, player_2, player_3, player_4 };
      
        try {
          const result = await mongodbCollection.insertOne(mongodbDocument);
          const insertId = result.insertedId;
      
          console.log('Données insérées avec succès dans MongoDB');
          res.json({ message: 'Toutes les données Players_MongoDB ont été insérées avec succès.', insertId });
        } catch (error) {
          console.error('Erreur lors de l\'insertion des données MongoDB :', error);
          res.status(500).send('Erreur lors de l\'insertion des données MongoDB.');
        }
        break;
      
      case 'Neo4j':
        const sessionNeo4J = neo4jDriver.session();
      
        try {
          const result = await sessionNeo4J.run(
            `CREATE (a:Players {player_1: "${ player_1 }", player_2: "${ player_2 }", player_3: "${ player_3 }", player_4: "${ player_4 }"}) RETURN a`
          );
      
          res.json(result);
        } catch (error) {
          console.error('Erreur lors de l\'insertion des données dans Neo4j :', error);
          res.status(500).send('Erreur lors de l\'insertion des données dans Neo4j.');
        } finally {
          await sessionNeo4J.close();
        }
        break;

    }
  } catch (error) {
    console.error('Erreur inattendue :', error);
    res.status(500).send('Erreur inattendue.');
  }
});

// Endpoint pour l'insertion de données dans la table 'Rounds'
app.post('/api/rounds', async (req, res) => {
  const { game_id ,strokes, winner, databaseType } = req.body;

  try {
    // Utilisez la variable 'databaseType' pour déterminer dans quelle base de données les données doivent être insérées
    switch (databaseType) {
      case 'MySQL':
        const mysqlSql = 'INSERT INTO rounds (game_id, strokes, winner) VALUES (?, ?, ?)';
        const mysqlValues = [game_id, strokes, winner];
        mysqlConnection.query(mysqlSql, mysqlValues, (mysqlError, result) => {
          if (mysqlError) {
            console.error('Erreur lors de l\'insertion des données MySQL :', mysqlError);
            return res.status(500).send('Erreur lors de l\'insertion des données MySQL.');
          }

          console.log('Données insérées avec succès dans MySQL');
          res.json({ message: 'Toutes les données ont été insérées avec succès.', insertId : result.insertId});
        });
        break;
      case 'SQLite':
        const sqliteSql = 'INSERT INTO rounds (game_id, strokes, winner) VALUES (?, ?, ?)';
        const sqliteValues = [game_id, strokes, winner];
        sqliteConnection.run(sqliteSql, sqliteValues, (sqliteError, result) => {
          if (sqliteError) {
            console.error('Erreur lors de l\'insertion des données SQLite :', sqliteError);
            return res.status(500).send('Erreur lors de l\'insertion des données SQLite.');
          }

          // Utilisez this.lastID pour récupérer l'ID inséré
          const insertId = this.lastID;
      
          console.log('Données insérées avec succès dans SQLite');
          res.json({ message: 'Toutes les données SQLite ont été insérées avec succès.', insertId });
        });
        break;

      // Case MongoDB dans votre script d'insertion
      case 'MongoDB':
        await connectToMongo();
        const mongodbDb = mongodbConnection.db(databaseConfig.mongodb.database);
        const mongodbCollection = mongodbDb.collection('Rounds'); // Modifié pour correspondre à la collection "Rounds"
        const mongodbDocument = { game_id, strokes, winner };
        
        try {
          const result = await mongodbCollection.insertOne(mongodbDocument);
          const insertId = result.insertedId;

          console.log('Données insérées avec succès dans MongoDB');
          res.json({ message: 'Toutes les données Rounds_MongoDB ont été insérées avec succès.', insertId });
        } catch (error) {
          console.error('Erreur lors de l\'insertion des données MongoDB :', error);
          res.status(500).send('Erreur lors de l\'insertion des données MongoDB.');
        }
        break;
      
      case 'Neo4j':
        const sessionNeo4J = neo4jDriver.session();
      
        try {
          const result = await sessionNeo4J.run(
            `CREATE (p:Rounds {game_id: "${ game_id }", strokes: "${ strokes }", winner: "${ winner }"}) RETURN p`
          );

          const round_id = result.records[0]._fields[0].identity.low;

          const result2 = await sessionNeo4J.run(
            `MATCH (g:Game), (r:Rounds)
            WHERE ID(g) = ${ game_id } AND ID(r) = ${ round_id }
            CREATE (g)-[:ROUNDS_PLAYS]->(r)
            RETURN g, r`
          );
      
          res.json(result);
        } catch (error) {
          console.error('Erreur lors de l\'insertion des données dans Neo4j :', error);
          res.status(500).send('Erreur lors de l\'insertion des données dans Neo4j.');
        } finally {
          await sessionNeo4J.close();
        }
        break;


    }
  } catch (error) {
    console.error('Erreur inattendue :', error);
    res.status(500).send('Erreur inattendue.');
  }
});

// Endpoint pour récupérer les données de la table 'Game'
app.post('/api/game', async (req, res) => {
  const { players_id, score, winner, databaseType } = req.body;

  try {
    // Utilisez la variable 'databaseType' pour déterminer dans quelle base de données les données doivent être insérées
    switch (databaseType) {
      case 'MySQL':
        const mysqlSql = 'INSERT INTO game (players_id, score) VALUES (?, ?)';
        const mysqlValues = [players_id, score];
        mysqlConnection.query(mysqlSql, mysqlValues, (mysqlError, result) => {
          if (mysqlError) {
            console.error('Erreur lors de l\'insertion des données MySQL :', mysqlError);
            return res.status(500).send('Erreur lors de l\'insertion des données MySQL.');
          }

          console.log('Données insérées avec succès dans MySQL');
          res.json({ message: 'Toutes les données Game_MySQL ont été insérées avec succès.', insertId : result.insertId });
        });
        break;

        case 'SQLite':
          const sqliteSql = 'INSERT INTO game (players_id, score) VALUES (?, ?)';
          const sqliteValues = [players_id, score];
          sqliteConnection.run(sqliteSql, sqliteValues, function (sqliteError) {
            if (sqliteError) {
              console.error('Erreur lors de l\'insertion des données SQLite :', sqliteError);
              return res.status(500).send('Erreur lors de l\'insertion des données SQLite.');
            }
        
            // Utilisez this.lastID pour récupérer l'ID inséré
            const insertId = this.lastID;
        
            console.log('Données insérées avec succès dans SQLite');
            res.json({ message: 'Toutes les données Game_SQLite ont été insérées avec succès.', insertId });
          });
          break;        
      
      case 'MongoDB':
        await connectToMongo();
        const mongodbDb = mongodbConnection.db(databaseConfig.mongodb.database);
        const mongodbCollection = mongodbDb.collection('Game'); // Modifié pour correspondre à la collection "Game"
        const mongodbDocument = { players_id, score };
      
        try {
          const result = await mongodbCollection.insertOne(mongodbDocument);
          const insertId = result.insertedId;
      
          console.log('Données insérées avec succès dans MongoDB');
          res.json({ message: 'Toutes les données Game_MongoDB ont été insérées avec succès.', insertId });
        } catch (error) {
          console.error('Erreur lors de l\'insertion des données MongoDB :', error);
          res.status(500).send('Erreur lors de l\'insertion des données MongoDB.');
        }
        break;
      
      case 'Neo4j':
        const sessionNeo4J = neo4jDriver.session();
      
        try {
          const result = await sessionNeo4J.run(
            `CREATE (p:Game {players_id: "${ players_id }", score: "${ score }"}) RETURN p`
          );
          
          const game_id = result.records[0]._fields[0].identity.low;

          await sessionNeo4J.run(
            `
            MATCH (p:Players), (g:Game)
            WHERE ID(p) = ${ players_id } AND ID(g) = ${ game_id }
            CREATE (p)-[:PARTICIPATES_IN]->(g)
            RETURN p, g
            `
          );

          // Mettre à jour le winner de la partie
          await sessionNeo4J.run(
            `
            MATCH (p:Players), (g:Game)
            WHERE ID(p) = ${ players_id } AND ID(g) = ${ game_id }
            SET g.winner = "${ winner }"
            RETURN p, g
            `
          );
          
          res.json(result);
        } catch (error) {
          console.error('Erreur lors de l\'insertion des données dans Neo4j :', error);
          res.status(500).send('Erreur lors de l\'insertion des données dans Neo4j.');
        } finally {
          await sessionNeo4J.close();
        }
        break;
        
    }
  } catch (error) {
    console.error('Erreur inattendue :', error);
    res.status(500).send('Erreur inattendue.');
  }
});

app.post('/api/update_score_game', async (req, res) => {
  const { score, id_game, winner, databaseType } = req.body;

  try {
    let sql, values;

    switch (databaseType) {
      case 'MySQL':
        sql = 'UPDATE game SET score = ? WHERE id_game = ?';
        values = [score, id_game];
        mysqlUpdate(sql, values, res);
        break;

      case 'SQLite':
        sql = 'UPDATE game SET score = ? WHERE id_game = ?';
        values = [score, id_game];
        sqliteUpdate(sql, values, res);
        break;

      case 'MongoDB':
        await connectToMongo();
        const mongodbDb = mongodbConnection.db(databaseConfig.mongodb.database);
        const mongodbCollection = mongodbDb.collection('Game'); // Modifié pour correspondre à la collection "Game"
      
        // Utilisez updateOne pour mettre à jour le document avec le même id_game
        const result = await mongodbCollection.updateOne(
          { id_game: id_game },
          { $set: { score: score } }
        );
      
        if (result.modifiedCount > 0) {
          console.log('Données mises à jour avec succès dans MongoDB');
          res.json({ message: 'Toutes les données ont été mises à jour avec succès.' });
        } else {
          console.log('Aucune donnée mise à jour dans MongoDB');
          res.json({ message: 'Aucune donnée mise à jour.' });
        }
        break;
      
      case 'Neo4j':
        const sessionNeo4J = neo4jDriver.session();
      
        try {
          const result = await sessionNeo4J.run(
             `MATCH (g:Game)
              WHERE ID(g) = ${id_game} // Utilisez l'ID généré automatiquement
              SET g.score = "${score}"
              SET g.winner = "${winner}"
              RETURN g`
          );
      
          res.json(result);
        } catch (error) {
          console.error('Erreur lors de la mise à jour des données dans Neo4j :', error);
          res.status(500).send('Erreur lors de la mise à jour des données dans Neo4j.');
        } finally {
          await sessionNeo4J.close();
        }
        break;
        
    }
  } catch (error) {
    console.error('Erreur inattendue :', error);
    res.status(500).send('Erreur inattendue.');
  }
});

app.post('/api/transfer', async (req, res) => {
  const { sourceDatabase, destinationDatabase } = req.body;

  try {
    switch (sourceDatabase) {
      case 'MySQL':
        const mysqlData = await fetchDataFromMySQL();
        await insertDataIntoDestination(mysqlData, destinationDatabase);
        break;

      case 'SQLite':
        const sqliteData = await fetchDataFromSQLite();
        await insertDataIntoDestination(sqliteData, destinationDatabase);
        break;

      case 'MongoDB':
        const mongodbData = await fetchDataFromMongoDB();
        await insertDataIntoDestination(mongodbData, destinationDatabase);
        break;
      
      case 'Neo4j':
        const neo4jData = await fetchDataFromNeo4j();
        await insertDataIntoDestination(neo4jData, destinationDatabase);
        break;

      default:
        throw new Error('Invalid source database');
    }

    res.json({ message: 'Data transferred successfully' });
  } catch (error) {
    console.error('Transfer error:', error);
    res.status(500).send('Error transferring data');
  }
});

async function fetchDataFromMySQL() {
  return new Promise((resolve, reject) => {
    const mysqlSql = 'SELECT * FROM Players';

    mysqlConnection.query(mysqlSql, (mysqlError, playersResult) => {
      if (mysqlError) {
        reject(mysqlError);
        return;
      }

      const mysqlSqlGame = 'SELECT * FROM Game';
      mysqlConnection.query(mysqlSqlGame, (gameError, gameResult) => {
        if (gameError) {
          reject(gameError);
          return;
        }

        const mysqlSqlRounds = 'SELECT * FROM Rounds';
        mysqlConnection.query(mysqlSqlRounds, (roundsError, roundsResult) => {
          if (roundsError) {
            reject(roundsError);
            return;
          }

          const data = {
            players: playersResult,
            game: gameResult,
            rounds: roundsResult,
          };

          resolve(data);
        });
      });
    });
  });
}

async function fetchDataFromSQLite() {
  return new Promise((resolve, reject) => {
    const sqliteSqlPlayers = 'SELECT * FROM Players';
    const sqliteSqlGame = 'SELECT * FROM Game';
    const sqliteSqlRounds = 'SELECT * FROM Rounds';

    sqliteConnection.all(sqliteSqlPlayers, (playersError, playersResult) => {
      if (playersError) {
        reject(playersError);
        return;
      }

      sqliteConnection.all(sqliteSqlGame, (gameError, gameResult) => {
        if (gameError) {
          reject(gameError);
          return;
        }

        sqliteConnection.all(sqliteSqlRounds, (roundsError, roundsResult) => {
          if (roundsError) {
            reject(roundsError);
            return;
          }

          const data = {
            players: playersResult,
            game: gameResult,
            rounds: roundsResult,
          };

          resolve(data);
        });
      });
    });
  });
}

async function fetchDataFromMongoDB() {
  try {
    await connectToMongo();
    const mongodbDb = mongodbConnection.db(databaseConfig.mongodb.database);

    const playersCollection = mongodbDb.collection('Players');
    const gameCollection = mongodbDb.collection('Game');
    const roundsCollection = mongodbDb.collection('Rounds');

    const players = await playersCollection.find().toArray();
    const game = await gameCollection.find().toArray();
    const rounds = await roundsCollection.find().toArray();

    const data = {
      players: players,
      game: game,
      rounds: rounds,
    };

    return data;
  } catch (error) {
    console.error('Error fetching data from MongoDB:', error);
    throw error;
  }
}

async function fetchDataFromNeo4j() {
  const sessionNeo4J = neo4jDriver.session();

  try {
    const playersResult = await sessionNeo4J.run('MATCH (p:Players) RETURN p');
    const gameResult = await sessionNeo4J.run('MATCH (p:Game) RETURN p');
    const roundsResult = await sessionNeo4J.run('MATCH (p:Rounds) RETURN p');

    const data = {
      players: playersResult.records.map((record) => record.get(0).properties),
      game: gameResult.records.map((record) => record.get(0).properties),
      rounds: roundsResult.records.map((record) => record.get(0).properties),
    };

    return data;
  } catch (error) {
    console.error('Error fetching data from Neo4j:', error);
    throw error;
  }
}

async function insertDataIntoDestination(data, destinationDatabase) {
  switch (destinationDatabase) {
    case 'MySQL':
      await insertDataIntoMySQL(data);
      break;

    case 'SQLite':
      await insertDataIntoSQLite(data);
      break;

    case 'MongoDB':
      await insertDataIntoMongoDB(data);
      break;

    case 'Neo4j':
      await insertDataIntoNeo4j(data);
      break;

    default:
      throw new Error('Invalid destination database');
  }
}


// --------- Insertion des données dans MySQL --------- //
async function insertDataIntoMySQL(data) {
  const { players, game, rounds } = data;

  await insertPlayersIntoMySQL(players);
  await insertGameIntoMySQL(game);
  await insertRoundsIntoMySQL(rounds);
}

async function insertPlayersIntoMySQL(players) {
  const mysqlSql = 'INSERT INTO Players (player_1, player_2, player_3, player_4) VALUES (?, ?, ?, ?)';
  console.log(players);
  for (const player of players) {
    const mysqlValues = [player.player_1, player.player_2, player.player_3, player.player_4];
    await executeMySQLQuery(mysqlSql, mysqlValues);
  }
}

async function insertGameIntoMySQL(game) {
  const mysqlSql = 'INSERT INTO Game (players_id, score) VALUES (?, ?)';
  console.log(game);
  for (const gameRecord of game) {
    const mysqlValues = [gameRecord.players_id, gameRecord.score];
    await executeMySQLQuery(mysqlSql, mysqlValues);
  }
}

async function insertRoundsIntoMySQL(rounds) {
  const mysqlSql = 'INSERT INTO Rounds (game_id, strokes, winner) VALUES (?, ?, ?)';
  console.log(rounds);
  for (const round of rounds) {
    const mysqlValues = [round.game_id, round.strokes, round.winner];
    await executeMySQLQuery(mysqlSql, mysqlValues);
  }
}

// --------- Insertion des données dans SQLite --------- //
async function insertDataIntoSQLite(data) {
  const { players, game, rounds } = data;

  await insertPlayersIntoSQLite(players);
  await insertGameIntoSQLite(game);
  await insertRoundsIntoSQLite(rounds);
}

async function insertPlayersIntoSQLite(players) {
  const sqliteSql = 'INSERT INTO Players (player_1, player_2, player_3, player_4) VALUES (?, ?, ?, ?)';

  for (const player of players) {
    const sqliteValues = [player.player_1, player.player_2, player.player_3, player.player_4];
    await executeSQLiteQuery(sqliteSql, sqliteValues);
  }
}

async function insertGameIntoSQLite(game) {
  const sqliteSql = 'INSERT INTO Game (players_id, score) VALUES (?, ?)';

  for (const gameRecord of game) {
    const sqliteValues = [gameRecord.players_id, gameRecord.score];
    await executeSQLiteQuery(sqliteSql, sqliteValues);
  }
}

async function insertRoundsIntoSQLite(rounds) {
  const sqliteSql = 'INSERT INTO Rounds (game_id, strokes, winner) VALUES (?, ?, ?)';

  for (const round of rounds) {
    const sqliteValues = [round.game_id, round.strokes, round.winner];
    await executeSQLiteQuery(sqliteSql, sqliteValues);
  }
}

// --------- Insertion des données dans MongoDB --------- //
async function insertDataIntoMongoDB(data) {
  await connectToMongo();
  const mongodbDb = mongodbConnection.db(databaseConfig.mongodb.database);

  await insertPlayersIntoMongoDB(data.players, mongodbDb);
  await insertGameIntoMongoDB(data.game, mongodbDb);
  await insertRoundsIntoMongoDB(data.rounds, mongodbDb);
}

async function insertPlayersIntoMongoDB(players, mongodbDb) {
  const mongodbCollection = mongodbDb.collection('Players');
  await mongodbCollection.insertMany(players);
}

async function insertGameIntoMongoDB(game, mongodbDb) {
  const mongodbCollection = mongodbDb.collection('Game');
  await mongodbCollection.insertMany(game);
}

async function insertRoundsIntoMongoDB(rounds, mongodbDb) {
  const mongodbCollection = mongodbDb.collection('Rounds');
  await mongodbCollection.insertMany(rounds);
}

// --------- Insertion des données dans Neo4j --------- //
async function insertDataIntoNeo4j(data) {
  const { players, game, rounds } = data;

  await insertPlayersIntoNeo4j(players);
  await insertGameIntoNeo4j(game);
  await insertRoundsIntoNeo4j(rounds);
}

async function insertPlayersIntoNeo4j(players) {
  const sessionNeo4J = neo4jDriver.session();

  for (const player of players) {
    await sessionNeo4J.run(
      `CREATE (p:Player {player_1: "${ player.player_1 }", player_2: "${ player.player_2 }", player_3: "${ player.player_3 }", player_4: "${ player.player_4 }"}) RETURN p`
    );
  }

  await sessionNeo4J.close();
}

async function insertGameIntoNeo4j(game) {
  const sessionNeo4J = neo4jDriver.session();

  for (const gameRecord of game) {
    await sessionNeo4J.run(
      `CREATE (p:Game {players_id: "${ gameRecord.players_id }", score: "${ gameRecord.score }"}) RETURN p`
    );
  }

  await sessionNeo4J.close();
}

async function insertRoundsIntoNeo4j(rounds) {
  const sessionNeo4J = neo4jDriver.session();

  for (const round of rounds) {
    await sessionNeo4J.run(
      `CREATE (p:Round {game_id: "${ round.game_id }", strokes: "${ round.strokes }", winner: "${ round.winner }"}) RETURN p`
    );
  }

  await sessionNeo4J.close();
}

// --------- Exécution des reqûetes MySQL  --------- //
async function executeMySQLQuery(sql, values) {
  return new Promise((resolve, reject) => {
    mysqlConnection.query(sql, values, (error, result) => {
      if (error) {
        console.error('MySQL Query Error:', error);
        reject(error);
      } else {
        resolve(result);
      }
    });
  });
}

// --------- Exécution des reqûetes SQLite --------- //
async function executeSQLiteQuery(sql, values) {
  return new Promise((resolve, reject) => {
    sqliteConnection.run(sql, values, function (error) {
      if (error) {
        console.error('SQLite Query Error:', error);
        reject(error);
      } else {
        resolve({ insertId: this.lastID });
      }
    });
  });
}

function mysqlUpdate(sql, values, res) {
  mysqlConnection.query(sql, values, (mysqlError) => {
    if (mysqlError) {
      console.error('Erreur lors de la mise à jour des données MySQL :', mysqlError);
      return res.status(500).send('Erreur lors de la mise à jour des données MySQL.');
    }

    console.log('Données mises à jour avec succès dans MySQL');
    res.json({ message: 'Toutes les données ont été mises à jour avec succès.' });
  });
}

function sqliteUpdate(sql, values, res) {
  sqliteConnection.run(sql, values, (sqliteError) => {
    if (sqliteError) {
      console.error('Erreur lors de l\'insertion des données SQLite :', sqliteError);
      return res.status(500).send('Erreur lors de l\'insertion des données SQLite.');
    }
      
    console.log('Données insérées avec succès dans SQLite');
    res.json({ message: 'Toutes les données SQLite ont été mise à jour avec succès.'});
  });
}

// Endpoint pour récupérer la configuration de la base de données
app.get('/api/databaseConfig', (req, res) => {
  res.json(databaseConfig);
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
