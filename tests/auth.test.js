const request = require('supertest');
const createApp = require('../src/app');
const bootstrapAdmin = require('../src/bootstrapAdmin');
const { db, setupDatabase, truncateUsers, closeDatabase } = require('./setup');

const app = createApp();

beforeAll(async () => {
  await setupDatabase();
});

afterEach(async () => {
  await truncateUsers();
});

afterAll(async () => {
  await closeDatabase();
});

describe('GET /health', () => {
  it('returns 200 with service status', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok', service: 'user-service' });
  });
});

describe('POST /auth/register', () => {
  it('registers a new user and returns 201 with READER role', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ email: 'newuser@example.com', password: 'secret123' });

    expect(res.status).toBe(201);
    expect(res.body).toEqual({
      id: expect.any(String),
      email: 'newuser@example.com',
      role: 'READER',
    });
  });

  it('rejects an invalid email format with 400', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ email: 'not-an-email', password: 'secret123' });

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ statusCode: 400 });
    expect(res.body).toHaveProperty('timestamp');
  });

  it('rejects a duplicate (case-insensitive) email with 409', async () => {
    await request(app)
      .post('/auth/register')
      .send({ email: 'dupe@example.com', password: 'secret123' });

    const res = await request(app)
      .post('/auth/register')
      .send({ email: 'DUPE@example.com', password: 'anotherpass' });

    expect(res.status).toBe(409);
    expect(res.body).toMatchObject({ statusCode: 409 });
  });

  it('ignores a client-supplied role and always forces READER', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ email: 'escalate@example.com', password: 'secret123', role: 'ADMIN' });

    expect(res.status).toBe(201);
    expect(res.body.role).toBe('READER');

    const stored = await db('users').where({ email: 'escalate@example.com' }).first();
    expect(stored.role).toBe('READER');
  });

  it('rejects a too-short password with 400', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ email: 'shortpass@example.com', password: '123' });

    expect(res.status).toBe(400);
  });
});

describe('POST /auth/login', () => {
  const email = 'logintest@example.com';
  const password = 'correctpassword';

  beforeEach(async () => {
    await request(app).post('/auth/register').send({ email, password });
  });

  it('logs in with correct credentials and returns a token', async () => {
    const res = await request(app).post('/auth/login').send({ email, password });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      expiresIn: 24 * 60 * 60,
      user: { email, role: 'READER' },
    });
    expect(typeof res.body.token).toBe('string');
  });

  it('rejects a wrong password with 401', async () => {
    const res = await request(app).post('/auth/login').send({ email, password: 'wrongpassword' });

    expect(res.status).toBe(401);
    expect(res.body).toMatchObject({ statusCode: 401 });
  });

  it('rejects a nonexistent user with 401', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'ghost@example.com', password: 'whatever1' });

    expect(res.status).toBe(401);
    expect(res.body).toMatchObject({ statusCode: 401 });
  });
});

describe('admin bootstrap', () => {
  it('seeds exactly one ADMIN user when the table is empty', async () => {
    const result = await bootstrapAdmin();
    expect(result.seeded).toBe(true);

    const admins = await db('users').where({ role: 'ADMIN' });
    expect(admins).toHaveLength(1);
    expect(admins[0].email).toBe(process.env.INITIAL_ADMIN_EMAIL);
  });

  it('is idempotent: does not reseed when users already exist', async () => {
    const first = await bootstrapAdmin();
    expect(first.seeded).toBe(true);

    // Any user existing (not just the admin) should block reseeding.
    const second = await bootstrapAdmin();
    expect(second.seeded).toBe(false);

    const allUsers = await db('users');
    expect(allUsers).toHaveLength(1);
  });
});
