// Firebase's Email/Password provider needs an email-shaped identifier, but this app only
// ever shows a plain username field. This maps each username to a synthetic email that's
// never sent anywhere real — just a way to key a Firebase account without exposing that
// detail in the UI. To add a person: create their account in the Firebase console using
// usernameToEmail(theirUsername), then they log in with just the plain username.
const USERNAME_DOMAIN = 'lm-organizer.local'

export function usernameToEmail(username) {
  return `${username.trim().toLowerCase()}@${USERNAME_DOMAIN}`
}
