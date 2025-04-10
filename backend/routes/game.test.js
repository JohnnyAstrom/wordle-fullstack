import request from 'supertest';
import express from 'express';
import path from 'path';
import fs from 'fs';
import gameRouter from './game.js';
import { createGame } from '../logic/activeGames.js';

const testPath = path.resolve('./data/test-save-highscores.json');

const app = express();
app.set('view engine', 'ejs');
app.set('views', path.resolve('./views'));

app.use(express.json());
app.use('/api/game', gameRouter);

describe('POST /api/game/start', () => {
  it('should return a gameId and wordLength when starting a new game', async () => {
    const response = await request(app)
      .post('/api/game/start')
      .send({ length: 5, uniqueOnly: true });

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('gameId');
    expect(typeof response.body.gameId).toBe('string');
    expect(response.body).toHaveProperty('wordLength', 5);
  });

  it('should return 404 if no word could be found', async () => {
    const response = await request(app)
      .post('/api/game/start')
      .send({ length: 99, uniqueOnly: true });

    expect(response.statusCode).toBe(404);
    expect(response.body).toHaveProperty('error');
  });
});

describe('POST /api/game/guess', () => {
  it('should return feedback when guessing a word with a valid gameId', async () => {
    const correctWord = 'APPLE';
    const gameId = createGame(correctWord);

    const response = await request(app)
      .post('/api/game/guess')
      .send({ gameId, guessedWord: 'ALERT' });

    expect(response.statusCode).toBe(200);
    expect(Array.isArray(response.body.feedback)).toBe(true);

    const letters = response.body.feedback.map(f => f.letter).join('');
    expect(letters).toBe('ALERT');
  });

  it('should return 404 if gameId is not found', async () => {
    const response = await request(app)
      .post('/api/game/guess')
      .send({ gameId: 'non-existent-id', guessedWord: 'ALERT' });

    expect(response.statusCode).toBe(404);
    expect(response.body).toHaveProperty('error');
  });

  it('should return 400 if required data is missing', async () => {
    const response = await request(app)
      .post('/api/game/guess')
      .send({ gameId: 'something' });

    expect(response.statusCode).toBe(400);
    expect(response.body).toHaveProperty('error');
  });
});

describe('POST /api/game/finish', () => {
  afterEach(() => {
    if (fs.existsSync(testPath)) {
      fs.unlinkSync(testPath);
    }
  });

  it('should end the game and return highscore entry with time', async () => {
    const word = 'APPLE';
    const gameId = createGame(word);

    await new Promise((resolve) => setTimeout(resolve, 1000));

    const response = await request(app)
      .post('/api/game/finish')
      .send({
        gameId,
        name: 'TestUser',
        attempts: 3,
        wordLength: word.length,
        uniqueOnly: true,
        useTestPath: true,
        timedMode: true
      });

    expect(response.statusCode).toBe(201);
    expect(response.body).toHaveProperty('message', 'Highscore sparat!');
    expect(response.body.entry).toMatchObject({
      name: 'TestUser',
      attempts: 3,
      wordLength: word.length,
      uniqueOnly: true,
      timedMode: true
    });
    expect(typeof response.body.entry.time).toBe('number');
    expect(response.body.entry.time).toBeGreaterThan(0);
  });
});
