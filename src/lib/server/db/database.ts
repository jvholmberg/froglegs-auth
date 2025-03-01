/***** IMPORTANT! ***************************************************************/
import "server-only";
/********************************************************************************/

import mariadb, { PoolConfig } from "mariadb";
import registerService from "@/lib/server/register-service";

const isDevelopment = process.env.NODE_ENV === "development";

/**
 * We tried enabling multiple statements since we wanted to make use of the "USE" keyword.
 * Everything worked fine however since it affects how the data is received we decided against using it for the time being.
 * Instead of receiving the data like ...
 *
 * { affectedRows: number; insertedId: number; warningStatus: number; }
 *
 * Data is received like ...
 *
 * [
 *  { affectedRows: number; insertedId: number; warningStatus: number; },
 *  { affectedRows: number; insertedId: number; warningStatus: number; },
 * ]
 *
 * Might not be a big deal and perhaps we want to revisit this decision again.
 * The example above is pretty straightforward however when metadata gets thrown in the mix we get 2d arrays.
 */

const defaultConfig: PoolConfig = {
  connectionLimit: 10,
  namedPlaceholders: true,
  bigIntAsNumber: true,
  insertIdAsNumber: true,
  checkDuplicate: true,
  trace: isDevelopment,
  database: process.env.DB_NAME,
  idleTimeout: 10,
  charset: 'latin1',
  collation: 'latin1_swedish_ci'
};


const connectionConfig: PoolConfig = {
  host: process.env.DATABASE_HOST,
  port: process.env.DATABASE_PORT
    ? +process.env.DATABASE_PORT
    : undefined,
  database: process.env.DATABASE_NAME,
};


const db = registerService("db", () => {
  return mariadb.createPool({
    ...defaultConfig,
    ...connectionConfig,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
  });
});

export default db as mariadb.Pool;
