import { fetchWithAuth } from './httpClient.js'

const API = import.meta.env.VITE_API_BASE_URL

/** Returns the whole saved organizer blob, or {} if nothing's been saved yet. */
export async function getOrganizer() {
  const res = await fetchWithAuth(API)
  if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`)
  return res.json()
}

/** Overwrites the whole organizer blob — the backend has no partial-update endpoint. */
export async function saveOrganizer(data) {
  const res = await fetchWithAuth(API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`)
  return res.json()
}
