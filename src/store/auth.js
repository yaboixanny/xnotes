import { supabase } from './supabase'

export async function signUp(email, password, name) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name: name || 'Writer' } },
  })
  if (error) throw error
  return data.session
}

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data.session
}

export async function signOut() {
  await supabase.auth.signOut()
}
