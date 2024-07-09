import * as path from "path";
import { app } from "electron";
import Knex from 'knex';

const userDataPath = app.getPath("userData");
const dbPath = path.join(userDataPath, "folders.db");

const knex = Knex({
  client: 'sqlite3',
  connection: {
    filename: dbPath,
  },
  useNullAsDefault: true
});

app.on('ready', async () => {
  try {
    await knex.migrate.latest();
    console.log('Migrations executed successfully.');
  } catch (error) {
    console.error(`Error running migrations: ${error.message}`);
  }
});

export const loadFolders = async () => {
  return await knex.select('*').from('folders').orderBy('created_at');
};

export const addFolder = async (folderPath: string) => {
  return await knex('folders').insert({
    path: folderPath,
    created_at: new Date(),
    updated_at: new Date()
  });
};

export const updateLabel = async (id: number, label: string) => {
  return await knex('folders')
  .where({ id })
  .update({
    label,
    updated_at: new Date()
  });
};

export const updateFavorite = async (id: number, is_favorite: boolean) => {
  try {
    await knex('folders')
    .where({ id })
    .update({
      is_favorite,
      updated_at: new Date()
    });
  } catch (error) {
    console.error(error);
  }
}

export const removeFolder = async (id: number) => {
  return await knex('folders')
  .where({ id })
  .del();
};
