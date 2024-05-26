import { PrismaClient } from "@prisma/client";
import * as path from "path";
import { app } from "electron";

const userDataPath = app.getPath("userData");
const dbPath = path.join(userDataPath, "folders.db");

process.env.DATABASE_URL = `file:${dbPath}`;

const prisma = new PrismaClient();

export const loadFolders = async () => {
  return await prisma.folder.findMany({
    orderBy: {
      createdAt: "asc",
    },
  });
};

export const addFolder = async (folderPath: string) => {
  return await prisma.folder.create({
    data: {
      path: folderPath,
    },
  });
};

export const updateLabel = async (id: number, label: string) => {
  return await prisma.folder.update({
    where: {
      id,
    },
    data: {
      label,
    },
  });
};

export const updateFavorite = async (id: number, isFavorite: boolean) => {
  return await prisma.folder.update({
    where: {
      id,
    },
    data: {
      isFavorite,
    },
  });
};

export const removeFolder = async (id: number) => {
  return await prisma.folder.delete({
    where: {
      id,
    },
  });
};
