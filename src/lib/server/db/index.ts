import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema";

const {
  DATABASE_HOST,
  DATABASE_PORT,
  DATABASE_USER,
  DATABASE_PASSWORD,
  DATABASE_NAME,
  DATABASE_SSL,
} = process.env;

const password = DATABASE_PASSWORD ? `:${DATABASE_PASSWORD}` : "";
const sslMode = DATABASE_SSL || "disable";

export default drizzle({
  connection: {
    connectionString: `postgresql://${DATABASE_USER!}${password}@${DATABASE_HOST!}:${DATABASE_PORT || 5432}/${DATABASE_NAME!}?sslmode=${sslMode}`,
  },
  schema,
});
export { schema };
