export interface EnvironmentVariables {
  JWT_ACCESS_SECRET: string;
  JWT_REFRESH_SECRET: string;
  JWT_ACCESS_EXPIRES_IN: string;
  JWT_REFRESH_EXPIRES_IN: string;

  DB_HOST: string;
  DB_PORT: number;
  DB_USER: string;
  DB_PASS: string;
  DB_NAME: string;

  MONGO_URI: string;
  MONGO_USER: string;
  MONGO_PASS: string;
  MONGO_AUTH_SOURCE: string;
}
