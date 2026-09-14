const request = require('supertest');
const jwt = require('jsonwebtoken');
const createApp = require('../src/app');
const { db, setupDatabase, truncateUsers, closeDatabase } = require('./setup');

const app = createApp();

function tokenFor(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { algorithm: 'HS256', expiresIn: '24h' }
  );
}

async function registerUser(email, password) {
  const res = await request(app).post('/auth/register').send({ email, password });
  return res.body;
}

beforeAll(async () => {
  await setupDatabase();
});

afterEach(async () => {
  await truncateUsers();
});

afterAll(async () => {
  await closeDatabase();
});

describe('PATCH /users/:id/role', () => {
  it('allows an ADMIN to update another user\'s role', async () => {
    const target = await registerUser('target@example.com', 'password1');
    const adminRow = await db('users').where({ id: (await registerUser('admin@example.com', 'password1')).id }).first();
    await db('users').where({ id: adminRow.id }).update({ role: 'ADMIN' });
    const admin = { ...adminRow, role: 'ADMIN' };

    const res = await request(app)
      .patch(`/users/${target.id}/role`)
      .set('Authorization', `Bearer ${tokenFor(admin)}`)
      .send({ role: 'AUTHOR' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ id: target.id, email: target.email, role: 'AUTHOR' });

    const stored = await db('users').where({ id: target.id }).first();
    expect(stored.role).toBe('AUTHOR');
  });

  it('rejects the request with 401 when no token is provided', async () => {
    const target = await registerUser('notoken@example.com', 'password1');

    const res = await request(app).patch(`/users/${target.id}/role`).send({ role: 'AUTHOR' });

    expect(res.status).toBe(401);
    expect(res.body).toMatchObject({ statusCode: 401 });
  });

  it('rejects the request with 401 when the token is invalid', async () => {
    const target = await registerUser('badtoken@example.com', 'password1');

    const res = await request(app)
      .patch(`/users/${target.id}/role`)
      .set('Authorization', 'Bearer not-a-real-token')
      .send({ role: 'AUTHOR' });

    expect(res.status).toBe(401);
  });

  it('rejects a non-admin requester with 403', async () => {
    const target = await registerUser('target2@example.com', 'password1');
    const reader = await registerUser('reader@example.com', 'password1');

    const res = await request(app)
      .patch(`/users/${target.id}/role`)
      .set('Authorization', `Bearer ${tokenFor({ id: reader.id, email: reader.email, role: 'READER' })}`)
      .send({ role: 'AUTHOR' });

    expect(res.status).toBe(403);
    expect(res.body).toMatchObject({ statusCode: 403 });
  });

  it('rejects an invalid role value with 400', async () => {
    const target = await registerUser('target3@example.com', 'password1');
    const adminRow = await registerUser('admin2@example.com', 'password1');
    await db('users').where({ id: adminRow.id }).update({ role: 'ADMIN' });

    const res = await request(app)
      .patch(`/users/${target.id}/role`)
      .set('Authorization', `Bearer ${tokenFor({ id: adminRow.id, email: adminRow.email, role: 'ADMIN' })}`)
      .send({ role: 'SUPERUSER' });

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ statusCode: 400 });
  });

  it('returns 404 when the target user does not exist', async () => {
    const adminRow = await registerUser('admin3@example.com', 'password1');
    await db('users').where({ id: adminRow.id }).update({ role: 'ADMIN' });

    const res = await request(app)
      .patch('/users/00000000-0000-0000-0000-000000000000/role')
      .set('Authorization', `Bearer ${tokenFor({ id: adminRow.id, email: adminRow.email, role: 'ADMIN' })}`)
      .send({ role: 'AUTHOR' });

    expect(res.status).toBe(404);
    expect(res.body).toMatchObject({ statusCode: 404 });
  });
});
