require('dotenv').config();
const createApp = require('./app');
const db = require('./db');
const bootstrapAdmin = require('./bootstrapAdmin');

const PORT = process.env.PORT || 3002;

async function main() {
  // Verify DB connectivity before doing anything else.
  await db.raw('SELECT 1');

  // Idempotent: only seeds the ADMIN account on a genuinely empty table.
  const { seeded } = await bootstrapAdmin();
  if (seeded) {
    console.log('Admin bootstrap: seeded initial ADMIN account');
  } else {
    console.log('Admin bootstrap: skipped (users already exist)');
  }

  const app = createApp();
  app.listen(PORT, () => {
    console.log(`user-service listening on port ${PORT}`);
  });
}

main().catch((err) => {
  console.error('Failed to start user-service:', err.message);
  process.exit(1);
});
