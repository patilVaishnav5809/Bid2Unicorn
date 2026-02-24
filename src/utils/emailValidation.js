const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const COMMON_DOMAIN_TYPOS = new Set([
  'gamil.com',
  'gmial.com',
  'gnail.com',
  'hotnail.com',
  'outlok.com',
  'yaho.com'
]);

export function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

export function validateEmailSyntax(email) {
  const normalized = normalizeEmail(email);
  if (!normalized) {
    return { valid: false, normalized, reason: 'Email is required.' };
  }

  if (!EMAIL_REGEX.test(normalized)) {
    return { valid: false, normalized, reason: 'Invalid email format.' };
  }

  const domain = normalized.split('@')[1] || '';
  if (COMMON_DOMAIN_TYPOS.has(domain)) {
    return { valid: false, normalized, reason: `Email domain "${domain}" looks misspelled.` };
  }

  return { valid: true, normalized, reason: null };
}
