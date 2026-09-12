export async function runMigrations(_databaseUrl: string): Promise<void> {
  throw new Error(
    'runMigrations is not available in platform mode. ' +
    'Run migrate-to-standalone.sh first to enable standalone mode.',
  );
}
