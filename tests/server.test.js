const request = require('supertest');
const { createApp } = require('../app');
const { startServer } = require('../index');

describe('Express App', () => {
  const app = createApp();

  test('GET /health', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.text).toBe('OK');
  });

  test('GET / returns game.html', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.text).toContain('拼豆跳跳消');
  });

  test('static file game.html', async () => {
    const res = await request(app).get('/game.html');
    expect(res.status).toBe(200);
    expect(res.text).toContain('<!DOCTYPE html>');
  });

  test('static js file', async () => {
    const res = await request(app).get('/js/main.js');
    expect(res.status).toBe(200);
    expect(res.text).toContain('class Main');
  });
});

describe('startServer', () => {
  test('calls listen', () => {
    const listenMock = jest.fn((port, cb) => { cb && cb(); return 'server'; });
    const fakeApp = { listen: listenMock };

    const server = startServer({ port: 1234, app: fakeApp });

    expect(listenMock).toHaveBeenCalledWith(1234, expect.any(Function));
    expect(server).toBe('server');
  });
});
