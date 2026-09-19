/**
 * Same minimum as the backend: the login DTO accepts passwords of at least 8 characters, and a
 * new admin password (owner self-change or set by the platform admin) must meet that minimum,
 * otherwise the owner could not log in with it.
 */
export const MIN_PASSWORD_LENGTH = 8;

export const PASSWORD_TOO_SHORT = `Parol kamida ${MIN_PASSWORD_LENGTH} ta belgidan iborat bo'lishi kerak`;
