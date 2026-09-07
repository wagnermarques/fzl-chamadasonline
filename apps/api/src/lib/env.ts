function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

export const env = {
  jwtSecret: process.env.JWT_SECRET ?? "change-me-in-production",
  port: Number(process.env.PORT ?? 3333),
  databaseUrl: required("DATABASE_URL"),
};
