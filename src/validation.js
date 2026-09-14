const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VALID_ROLES = ['READER', 'AUTHOR', 'ADMIN'];

function isValidEmail(email) {
  return typeof email === 'string' && EMAIL_REGEX.test(email);
}

function isValidPassword(password) {
  return typeof password === 'string' && password.length >= 6;
}

function isValidRole(role) {
  return typeof role === 'string' && VALID_ROLES.includes(role);
}

module.exports = { isValidEmail, isValidPassword, isValidRole, VALID_ROLES };
