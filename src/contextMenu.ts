import { app, Menu, dialog, MenuItemConstructorOptions, Tray } from "electron";
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
import { Icon, getIcon } from "./icons";
import logger from "./logger";
import { Folder } from "knex/types/tables";

export const updateContextMenu = async (tray: Tray) => {
  const contextMenu = await createContextMenu(tray);

  tray.setContextMenu(contextMenu);
};

const createContextMenu = async (tray: Tray): Promise<Electron.Menu> => {
  const folders = await loadFolders();

  const favoriteMenuItems = await createMenuItems(
    folders.filter((item) => item.is_favorite),
    tray
  );
  const normalMenuItems = await createMenuItems(
    folders.filter((item) => !item.is_favorite),
    tray
  );

  const template: MenuItemConstructorOptions[] = [
    {
      label: "Adicionar Pasta",
      icon: getIcon(Icon.Add),
      click: async () => {
        try {
          const result = await dialog.showOpenDialog({
            properties: ["openDirectory"],
          });

          if (!result.canceled && result.filePaths.length > 0) {
            await addFolder(result.filePaths[0]);
            await updateContextMenu(tray);
          }
        } catch (error) {
          logger.error(`Erro ao adicionar pasta: ${error}`);
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
    icon: getIcon(Icon.Close),
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
        icon: getIcon(Icon.Directory),
        click: () => {
          exec(`code "${folder.path}"`, (error, stdout, stderr) => {
            if (error) {
              logger.error(`Erro: ${error.message}`);
              return;
            }
            if (stderr) {
              logger.error(`Stderr: ${stderr}`);
              return;
            }
            console.log(`Stdout: ${stdout}`);
          });
        },
      },
      {
        label: folder.is_favorite
          ? "Remover dos favoritos"
          : "Adicionar aos favoritos",
        type: "checkbox",
        icon: getIcon(Icon.Favorite),
        checked: folder.is_favorite,
        click: async () => {
          await updateFavorite(folder.id, !folder.is_favorite);
          await updateContextMenu(tray);
        },
      },
      {
        label: "Renomear",
        icon: getIcon(Icon.Edit),
        click: async () => {
          try {
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
          } catch (error) {
            logger.error(`Erro ao renomear projeto: ${error}`);
          }
        },
      },
      {
        label: "Remover",
        icon: getIcon(Icon.Delete),
        click: async () => {
          await removeFolder(folder.id);
          await updateContextMenu(tray);
        },
      },
    ],
  }));
};
