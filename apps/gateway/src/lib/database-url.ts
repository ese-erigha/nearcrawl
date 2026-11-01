const LOCAL_DATABASE_PREFIX = 'postgres://local/'

export function isLocalDatabase(databaseUrl: string): boolean {
  return databaseUrl.startsWith(LOCAL_DATABASE_PREFIX)
}
