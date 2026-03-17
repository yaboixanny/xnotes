const ACCOUNT_KEY = 'xnote-account'
const SESSION_KEY = 'xnote-session'

async function hashPassword(password) {
  const data = new TextEncoder().encode(password)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

export function getAccount() {
  try { return JSON.parse(localStorage.getItem(ACCOUNT_KEY)) } catch { return null }
}

export function getSession() {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY)) } catch { return null }
}

export function signOut() {
  localStorage.removeItem(SESSION_KEY)
}

export async function createAccount(name, password) {
  const passwordHash = await hashPassword(password)
  const account = { name: name.trim() || 'Writer', passwordHash, createdAt: Date.now() }
  localStorage.setItem(ACCOUNT_KEY, JSON.stringify(account))
  const session = { name: account.name, loggedInAt: Date.now() }
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  return session
}

export async function login(password) {
  const account = getAccount()
  if (!account) return null
  const hash = await hashPassword(password)
  if (hash !== account.passwordHash) return null
  const session = { name: account.name, loggedInAt: Date.now() }
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  return session
}
