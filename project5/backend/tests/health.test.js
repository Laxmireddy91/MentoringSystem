const request = require('supertest');
const app = require('../app');

describe('GET /api/health', () => {
  it('should return 200 OK with health status and environment', async () => {
    const res = await request(app).get('/api/health');
    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('UP');
    expect(res.body.message).toContain('Smart Mentoring System API is running healthy');
  });

  it('should return 404 for undefined endpoints', async () => {
    const res = await request(app).get('/api/non-existent-endpoint');
    expect(res.statusCode).toEqual(404);
    expect(res.body.success).toBe(false);
  });
});
