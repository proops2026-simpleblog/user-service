# Running the tests

These tests exercise the real Express app against a real Postgres database via
`knex`/`pg` (no DB mocking) - this keeps them honest about the unique-index,
constraint, and transaction behavior the spec depends on (case-insensitive
email uniqueness, role CHECK constraint, etc.).

## Requirements

- A Postgres instance reachable via the `DATABASE_URL` environment variable
  (the same one the service itself uses), with the database already created.
  - When running via Docker Compose, this is the `postgres` service and
    `DATABASE_URL` from `.env` works as-is.
  - When running locally outside Docker, temporarily point `DATABASE_URL` at
    `localhost` instead of the `postgres` hostname, e.g.:
    `DATABASE_URL=postgres://postgres:<password>@localhost:5432/user_db`
- `INITIAL_ADMIN_EMAIL` / `INITIAL_ADMIN_PASSWORD` set (already present in
  `.env`).

## What the tests do

Each test file runs the `create_users` migration against the configured
database before its suite, truncates the `users` table between tests so
suites don't interfere with each other, and closes the knex connection pool
afterward.

## Running

```bash
npm install
npm test
```

If `DATABASE_URL`'s host cannot be resolved/reached (for example, `postgres`
outside of the Compose network), the tests will fail at the DB-connection
step, not because of a code defect - start the Compose network first, or
point `DATABASE_URL` at a reachable Postgres instance.
