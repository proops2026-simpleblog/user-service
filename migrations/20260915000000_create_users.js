/**
 * Creates the `users` table for user-service (IRD-001 data model).
 * pgcrypto is required for gen_random_uuid() as the primary key default.
 */
exports.up = async function up(knex) {
  await knex.raw('CREATE EXTENSION IF NOT EXISTS pgcrypto');

  await knex.schema.createTable('users', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('email', 255).notNullable();
    table.string('password_hash', 255).notNullable();
    table
      .string('role', 20)
      .notNullable()
      .defaultTo('READER');
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    table.unique('email', { indexName: 'uq_users_email' });
  });

  await knex.raw(
    "ALTER TABLE users ADD CONSTRAINT chk_users_role CHECK (role IN ('READER', 'AUTHOR', 'ADMIN'))"
  );

  await knex.raw('CREATE UNIQUE INDEX uq_users_email_lower ON users (LOWER(email))');
};

exports.down = async function down(knex) {
  await knex.raw('DROP INDEX IF EXISTS uq_users_email_lower');
  await knex.schema.dropTableIfExists('users');
};
