/**
 * mongo-uri.util.ts
 * -----------------
 * Unica fonte di verità per costruire la connection URI di MongoDB.
 *
 * Legge MONGO_URI da .env (che già contiene host, porta e nome database,
 * es. "mongodb://localhost:27017/mongo_synapsis") e inietta le credenziali
 * (MONGO_USER / MONGO_PASS) subito dopo "mongodb://", più MONGO_AUTH_SOURCE
 * come query param.
 *
 * Nessuno script di seed/reset deve più costruire l'URI a mano: si chiama
 * sempre getMongoUri() da qui, così un cambio di nome database o credenziali
 * va fatto in un solo posto (.env).
 */

export function getMongoUri(): string {
  const baseUri = process.env.MONGO_URI;

  if (!baseUri) {
    throw new Error(
      'MONGO_URI non definita in .env (es. mongodb://localhost:27017/mongo_synapsis)',
    );
  }

  const user = process.env.MONGO_USER;
  const pass = process.env.MONGO_PASS;
  const authSource = process.env.MONGO_AUTH_SOURCE ?? 'admin';

  // Inietta user:pass@ subito dopo "mongodb://", solo se entrambi presenti
  let uriWithAuth = baseUri;
  if (user && pass) {
    uriWithAuth = baseUri.replace('mongodb://', `mongodb://${user}:${pass}@`);
  }

  // Aggiunge authSource come query param, gestendo sia il caso "nessun ?"
  // sia il caso "altri query param già presenti"
  const separator = uriWithAuth.includes('?') ? '&' : '?';
  return `${uriWithAuth}${separator}authSource=${authSource}`;
}
