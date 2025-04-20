/* eslint-disable @typescript-eslint/no-explicit-any */

/***** IMPORTANT! ***************************************************************/
import "server-only";
/********************************************************************************/

import { Pool, PoolConnection, SqlError } from "mariadb";
import dbPool from "@/lib/server/db/database";

export interface OkPacket {
  affectedRows: number;
  insertId: number;
  warningStatus: number;
}

export interface IGetRecord {
  noRecord?: boolean;
}

interface IQuerySqlOptions {
  connection?: PoolConnection | Pool | null;
  logLabel?: string | null;
  namedPlaceholders?: boolean;
}

interface IBasicQuerySqlOptions {
  connection?: PoolConnection | null;
  logLabel?: string | null;
  db?: string;
  table: string;
}

interface ISaveSqlOptions<T> extends IBasicQuerySqlOptions {
  id?: number | string | null;
  idColumn?: string | null;
  columnData: Partial<T>;
}

interface IInsertSingleSqlOptions<T> extends IBasicQuerySqlOptions {
  columnData: Partial<T>;
}

interface IInsertManySqlOptions<T> extends IBasicQuerySqlOptions  {
  columnDatas: Partial<T>[];
}

interface IInsertBatchSqlOptions extends IBasicQuerySqlOptions {
  columnNames: string[];
  batchData: any[][];
  ignore?: boolean;
}

interface IUpdateSqlOptions<T, I = number> extends IBasicQuerySqlOptions {
  id: I;
  idColumn: string;
  columnData: Partial<T>;
}

interface IUpdateCompositeSqlOptions<T> extends IBasicQuerySqlOptions {
  ids: { idColumn: string; id: string | number }[];
  columnData: Partial<T>;
}

export const SEPARATORS = {
  // for GROUP_CONCAT SEPARATOR
  group: { sql: "'~'", js: "~" },
  // between items in GROUP_CONCAT, CONCAT or CONCAT_WS
  unit: { sql: "'|'", js: "|" },
};

/**
 * Get Connection and begin transaction.
 * @returns
 */
export const beginTransaction = async () => {
  console.log("Begin transaction  ∩(˵☯‿☯˵)つ¤=[]:::::>")
  // No connection provided
  const connection = await dbPool.getConnection();
  await connection.query("SET TRANSACTION ISOLATION LEVEL READ COMMITTED");
  await connection.beginTransaction();
  return connection;
};

/**
 * Commit and release transaction. Connection is not ended however it is freed up to be used by another process
 * @param connection
 */
export const commitTransaction = async (connection: PoolConnection) => {
  console.log("Comitting transaction ☜(⌒▽⌒)☞")
  await connection.commit();
  await connection.release();
};

/**
 * Rollback and release connection. Connection is not ended however it is freed up to be used by another process
 * @param connection
 */
export const rollbackTransaction = async (connection: PoolConnection) => {
  console.log("Rollback transaction (╯°□°)╯︵ ┻━┻")
  await connection.rollback();
  await connection.release();
};

/**
 *
 * @param param0
 * @returns
 */
export const save = async <T>({
  columnData,
  ...options
}: ISaveSqlOptions<T>) => {
  if (options.id) {
    // Update
    return update({ ...options, columnData } as IUpdateSqlOptions<T>);
  } else {
    // Insert
    const insertSingleOptions: IInsertSingleSqlOptions<T> = {
      ...options,
      columnData,
    };
    return insertSingle(insertSingleOptions);
  }
};

/**
 *
 * @param param0
 * @returns
 */
export const insertSingle = async <T>({
  connection,
  db,
  table,
  columnData,
  logLabel,
}: IInsertSingleSqlOptions<T>): Promise<number> => {
  const conn = connection || await dbPool.getConnection();

  try {
    const columnNames = Object.keys(columnData);
    const values = Object.values(columnData);

    const sql = `
      INSERT INTO ${db || process.env.DATABASE_NAME}.${table}
      (
        ${columnNames.join(", ")}
      )
      VALUES (
        ${columnNames.map(() => "?").join(", ")}
      )
    `;

    // Log
    if (logLabel) {
      console.log(`[${logLabel} : sql] => `, sql);
      console.log(`[${logLabel} : values] => `, values);
    }

    const result = await conn.query<OkPacket>({
      sql,
      insertIdAsNumber: true,
      namedPlaceholders: false,
    }, values);

    return result.insertId;
  } catch (err) {
    // Log
    if (logLabel) {
      const sqlErr = err as SqlError;
      console.log(`[${logLabel} : err : code] => `, sqlErr.code);
      console.log(`[${logLabel} : err : text] => `, sqlErr.sqlMessage);
    }
    throw err;
  } finally {
    // End connection if not passed to function
    if (!connection) {
      await conn.end();
    }
  }
};

/**
 * Prepares data to format readable by insertBatch()
 * @param param0
 * @returns
 */
export const insertMany = async<T>({
  connection,
  logLabel,
  db,
  table,
  columnDatas,
}: IInsertManySqlOptions<T>): Promise<OkPacket>  => {

  const columnNames = Object.keys(columnDatas[0]);
  const batchData = Object.values(columnDatas).map((columnData: any) => {
    const ret = columnNames.map((columnName) => columnData[columnName]);
    return ret;
  });

  const result = await insertBatch({
    connection,
    logLabel,
    db,
    table,
    columnNames,
    batchData,
  });

  return result;
};

/**
 *
 * @param param0
 * @returns
 */
export const insertBatch = async ({
  connection,
  logLabel,
  db,
  table,
  columnNames,
  batchData,
  ignore = false,
}: IInsertBatchSqlOptions): Promise<OkPacket> => {
  try {
    // If connection
    let shouldCommit = false;
    if (!connection) {
      connection = await beginTransaction();
      shouldCommit = true;
    }

    const statement = ignore ? "INSERT IGNORE INTO" : "INSERT INTO";

    const sql = `
      ${statement} ${db}.${table}
      (
        ${columnNames.join(", ")}
      )
      VALUES (
        ${columnNames.map(() => "?").join(", ")}
      )
    `;

    // Log
    if (logLabel) {
      console.log(`[${logLabel} : sql] => `, sql);
      console.log(`[${logLabel} : values] => `, batchData);
    }

    const result = await connection.batch<OkPacket>({
      sql,
      insertIdAsNumber: true,
      namedPlaceholders: false,
    }, batchData);

    // If no connection was passed in. We commit transaction
    if (shouldCommit) {
      await commitTransaction(connection);
    }
    return result;
  } catch (err) {
    // Log
    if (logLabel) {
      const sqlErr = err as SqlError;
      console.log(`[${logLabel} : err : code] => `, sqlErr.code);
      console.log(`[${logLabel} : err : text] => `, sqlErr.sqlMessage);
    }
    throw err;
  }
};

/**
 *
 * @param param0
 * @returns
 */
export const update = async <T, I = number>(options: IUpdateSqlOptions<T, I>): Promise<I> => {
  const conn = options.connection || await dbPool.getConnection();

  try {
    const sql = `
      UPDATE ${options.db || process.env.DATABASE_NAME}.${options.table}
      SET
      ${/* Produce following "column = :column, " */""}
      ${Object.keys(options.columnData).map((column) =>
        `${column} = :${column}`
      ).join(", ")}
      WHERE ${options.idColumn} = :idToUpdate
    `;

    const values = {
      ...options.columnData,
      idToUpdate: options.id,
    };

    // Log
    if (options.logLabel) {
      console.log(`[${options.logLabel} : sql] => `, sql);
      console.log(`[${options.logLabel} : values] => `, values);
    }

    await conn.query<OkPacket>({
      sql,
      namedPlaceholders: true,
    }, values);

    return options.id;
  } catch (err) {
    // Log
    if (options.logLabel) {
      const sqlErr = err as SqlError;
      console.log(`[${options.logLabel} : err : code] => `, sqlErr.code);
      console.log(`[${options.logLabel} : err : text] => `, sqlErr.sqlMessage);
    }
    throw err;
  } finally {
    // End connection if not passed to function
    if (!options.connection) {
      await conn.end();
    }
  }
};

/**
 *
 * @param param0
 * @returns
 */
export const updateComposite = async <T>(options: IUpdateCompositeSqlOptions<T>): Promise<boolean> => {
  const conn = options.connection || await dbPool.getConnection();

  try {    
    const sql = `
      UPDATE ${options.db || process.env.DATABASE_NAME}.${options.table}
      SET
      ${/* Produce following "column = :column, " */""}
      ${Object.keys(options.columnData).map((column) =>
        `${column} = :${column}`
      ).join(", ")}
      WHERE ${options.ids.filter(({ id }) => id !== undefined).map(({ idColumn }) => `
        ${idColumn} = :${idColumn}
      `).join(" AND ")}
    `;
    
    const values = {
      ...options.columnData,
      ...(options.ids
        .filter(({ id }) => id !== undefined)
        .reduce((prev, { idColumn, id }) => ({
          ...prev,
          [idColumn]: id,
        }), {})),
    };

    // Log
    if (options.logLabel) {
      console.log(`[${options.logLabel} : sql] => `, sql);
      console.log(`[${options.logLabel} : values] => `, values);
    }

    await conn.query<OkPacket>({
      sql,
      namedPlaceholders: true,
    }, values);

    return true;
  } catch (err) {
    // Log
    if (options.logLabel) {
      const sqlErr = err as SqlError;
      console.log(`[${options.logLabel} : err : code] => `, sqlErr.code);
      console.log(`[${options.logLabel} : err : text] => `, sqlErr.sqlMessage);
    }
    throw err;
  } finally {
    // End connection if not passed to function
    if (!options.connection) {
      await conn.end();
    }
  }
};

/**
 *
 * @param sql
 * @param values
 * @param options
 * @returns
 */
export const query = async <T>(
  sql: string,
  values: any,
  options?: IQuerySqlOptions,
): Promise<T[]> => {
  const conn = options?.connection || await dbPool.getConnection();

  try {
    // Log
    if (options?.logLabel) {
      console.log(`[${options.logLabel} : sql] => `, sql);
      console.log(`[${options.logLabel} : values] => `, values);
    }

    const rows = await conn.query<T[]>({
      sql,
      namedPlaceholders: options?.namedPlaceholders !== undefined
        ? options.namedPlaceholders
        : true
    }, values);

    return rows;
  } catch (err) {
    // Log
    if (options?.logLabel) {
      const sqlErr = err as SqlError;
      console.log(`[${options.logLabel} : err : code] => `, sqlErr.code);
      console.log(`[${options.logLabel} : err : text] => `, sqlErr.sqlMessage);
    }
    throw err;
  } finally {
    // End connection if not passed to function
    if (!options?.connection) {
      await conn.end();
    }
  }

};

/**
 *
 * @param sql
 * @param values
 * @param options
 * @returns
 */
export const getRecord = async <T>(
  sql: string,
  values: any,
  options?: IQuerySqlOptions,
): Promise<T | null> => {
  const conn = options?.connection || await dbPool.getConnection();

  try {
    // Log
    if (options?.logLabel) {
      console.log(`[${options.logLabel} : sql] => `, sql);
      console.log(`[${options.logLabel} : values] => `, values);
    }

    const rows = await conn.query<T[]>({
      sql,
      namedPlaceholders: true,
    }, values);

    return rows.length
      ? rows[0]
      : null;
  } catch (err) {
    // Log
    if (options?.logLabel) {
      const sqlErr = err as SqlError;
      console.log(`[${options.logLabel} : err : code] => `, sqlErr.code);
      console.log(`[${options.logLabel} : err : text] => `, sqlErr.sqlMessage);
    }
    throw err;
  } finally {
    // End connection if not passed to function
    if (!options?.connection) {
      await conn.end();
    }
  }
};

/**
 *
 * @param sql
 * @param values
 * @param options
 */
export const deleteQuery = async (
  sql: string,
  values: any,
  options?: IQuerySqlOptions,
) => {
  const conn = options?.connection || await dbPool.getConnection();

  try {
    // Log
    if (options?.logLabel) {
      console.log(`[${options.logLabel} : sql] => `, sql);
      console.log(`[${options.logLabel} : values] => `, values);
    }

    await conn.query({
      sql,
      namedPlaceholders: true,
    }, values);
  } catch (err) {
    // Log
    if (options?.logLabel) {
      const sqlErr = err as SqlError;
      console.log(`[${options.logLabel} : err : code] => `, sqlErr.code);
      console.log(`[${options.logLabel} : err : text] => `, sqlErr.sqlMessage);
    }
    throw err;
  } finally {
    // End connection if not passed to function
    if (!options?.connection) {
      await conn.end();
    }
  }
};

export const write = async <T = void>(callback: (connection: PoolConnection) => Promise<T>) => {
  const connection = await beginTransaction();
  try {
    const ret = await callback(connection);
    await commitTransaction(connection);
    return ret;
  } catch (err: any) {
    await rollbackTransaction(connection);
    throw err;
  }
};

export const composeQualifiedList = (values: string[]): string => {
  return "'" + values.join("','") + "'";
};
