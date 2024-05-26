import {
  app,
  Menu,
  dialog,
  MenuItemConstructorOptions,
  Tray,
  nativeTheme,
} from "electron";
import * as path from "path";
import {
  loadFolders,
  addFolder,
  removeFolder,
  updateFavorite,
  updateLabel,
} from "./database";
import { exec } from "child_process";
import prompt from "electron-prompt";
import { Folder } from "@prisma/client";

export const updateContextMenu = async (tray: Tray) => {
  const contextMenu = await createContextMenu(tray);

  tray.setContextMenu(contextMenu);
};

const createContextMenu = async (tray: Tray): Promise<Electron.Menu> => {
  const folders = await loadFolders();

  const favoriteMenuItems = await createMenuItems(
    folders.filter((item) => item.isFavorite),
    tray
  );
  const normalMenuItems = await createMenuItems(
    folders.filter((item) => !item.isFavorite),
    tray
  );

  const addIcon = nativeTheme.shouldUseDarkColors
    ? path.join(__dirname, "icons", "add", "white.png")
    : path.join(__dirname, "icons", "add", "dark.png");
  const closeIcon = nativeTheme.shouldUseDarkColors
    ? path.join(__dirname, "icons", "cross", "white.png")
    : path.join(__dirname, "icons", "cross", "dark.png");

  const template: MenuItemConstructorOptions[] = [
    {
      label: "Adicionar Pasta",
      icon: addIcon,
      click: async () => {
        const result = await dialog.showOpenDialog({
          properties: ["openDirectory"],
        });

        if (!result.canceled && result.filePaths.length > 0) {
          await addFolder(result.filePaths[0]);
          await updateContextMenu(tray);
        }
      },
    },
    { type: "separator" },
  ];

  if (folders.length === 0) {
    template.push(
      {
        label: "Nenhuma projeto",
        enabled: false,
      },
      { type: "separator" }
    );
  }

  if (favoriteMenuItems.length > 0) {
    template.push(
      { label: "Favoritos", enabled: false },
      ...favoriteMenuItems,
      { type: "separator" }
    );
  }

  if (normalMenuItems.length > 0) {
    template.push(...normalMenuItems, { type: "separator" });
  }

  template.push({
    label: "Sair",
    icon: closeIcon,
    click: () => {
      app.quit();
    },
  });

  return Menu.buildFromTemplate(template);
};

const createMenuItems = async (
  folders: Folder[],
  tray: Tray
): Promise<MenuItemConstructorOptions[]> => {
  return folders.map((folder) => ({
    label: folder.label || path.basename(folder.path),
    toolTip: folder.path,
    submenu: [
      {
        label: "Abrir no VS Code",
        click: () => {
          exec(`code "${folder.path}"`, (error, stdout, stderr) => {
            if (error) {
              console.error(`Erro: ${error.message}`);
              return;
            }
            if (stderr) {
              console.error(`Stderr: ${stderr}`);
              return;
            }
            console.log(`Stdout: ${stdout}`);
          });
        },
      },
      {
        label: folder.isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos",
        type: "checkbox",
        checked: folder.isFavorite,
        click: async () => {
          await updateFavorite(folder.id, !folder.isFavorite);
          await updateContextMenu(tray);
        },
      },
      {
        label: "Renomear",
        click: async () => {
          const newLabel = await prompt({
            title: "Renomear projeto",
            label: "Nome:",
            inputAttrs: {
              type: "text",
              required: "true",
            },
            type: "input",
            value: folder.label || path.basename(folder.path),
          });

          if (newLabel !== null && newLabel !== "") {
            await updateLabel(folder.id, newLabel);
            await updateContextMenu(tray);
          }
        },
      },
      {
        label: "Remover",
        click: async () => {
          await removeFolder(folder.id);
          await updateContextMenu(tray);
        },
      },
    ],
  }));
};
