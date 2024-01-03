import axios from 'axios';

const API_URL = 'http://localhost:3000/api'; // Remplacez par l'URL de votre serveur Express

const api = axios.create({
  baseURL: API_URL,
});

export const getDatabaseConfig = () => api.get('/databaseConfig');
