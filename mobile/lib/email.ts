/** Match server normalizeLoginEmail for register/login. */
export function normalizeLoginEmail(input: string): string {
  const trimmed = input.trim().toLowerCase();
  const at = trimmed.indexOf('@');
  if (at <= 0) return trimmed;

  let local = trimmed.slice(0, at);
  let domain = trimmed.slice(at + 1);

  if (domain === 'googlemail.com') domain = 'gmail.com';

  if (domain === 'gmail.com') {
    local = (local.split('+')[0] ?? local).replace(/\./g, '');
    return `${local}@gmail.com`;
  }

  const subaddressDomains = [
    'outlook.com',
    'hotmail.com',
    'live.com',
    'yahoo.com',
    'icloud.com',
    'me.com',
  ];
  if (subaddressDomains.includes(domain)) {
    local = local.split('+')[0] ?? local;
  }

  return `${local}@${domain}`;
}
