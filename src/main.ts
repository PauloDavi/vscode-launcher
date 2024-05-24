import {
  app,
  Tray,
  Menu,
  dialog,
  MenuItemConstructorOptions,
  BrowserWindow,
} from "electron";
import * as path from "path";
import { exec } from "child_process";
import Database from "better-sqlite3";
import prompt from "electron-prompt";

interface Folder {
  id: number;
  path: string;
  label: string;
}

const dbPath = path.join(app.getPath("userData"), "folders.db");
const db = new Database(dbPath);

db.exec(`
    CREATE TABLE IF NOT EXISTS folders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        path TEXT NOT NULL,
        label TEXT,
        created_at TEXT NOT NULL
    )
`);

let tray: Tray | null = null;

const loadFolders = (): Folder[] => {
  const stmt = db.prepare(
    "SELECT id, path, label FROM folders ORDER BY created_at"
  );
  return stmt.all() as Folder[];
};

const addFolder = (folderPath: string) => {
  const stmt = db.prepare(
    "INSERT INTO folders (path, label, created_at) VALUES (?, ?, ?)"
  );
  stmt.run(folderPath, path.basename(folderPath), new Date().toISOString());
};

const updateLabel = (id: number, label: string) => {
  const stmt = db.prepare("UPDATE folders SET label = ? WHERE id = ?");
  stmt.run(label, id);
};

const removeFolder = (id: number) => {
  const stmt = db.prepare("DELETE FROM folders WHERE id = ?");
  stmt.run(id);
};

app.on("ready", () => {
  const icon = path.join(__dirname, "icon.png");

  new BrowserWindow({
    icon,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });

  tray = new Tray(icon);

  const updateContextMenu = () => {
    const folders = loadFolders();
    const folderMenuItems: MenuItemConstructorOptions[] = folders.map(
      (folder) => ({
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
            label: "Renomear",
            click: () => {
              prompt({
                title: "Renomear projeto",
                label: "Nome:",
                inputAttrs: {
                  type: "text",
                  required: "true",
                },
                type: "input",
                value: folder.label || path.basename(folder.path),
              })
                .then((newLabel) => {
                  if (newLabel !== null && newLabel !== "") {
                    updateLabel(folder.id, newLabel);
                    updateContextMenu();
                  }
                })
                .catch(console.error);
            },
          },
          {
            label: "Remover",
            click: () => {
              removeFolder(folder.id);
              updateContextMenu();
            },
          },
        ],
      })
    );

    const contextMenu = Menu.buildFromTemplate([
      {
        label: "Adicionar Pasta",
        click: () => {
          dialog
            .showOpenDialog({
              properties: ["openDirectory"],
            })
            .then((result) => {
              if (!result.canceled && result.filePaths.length > 0) {
                addFolder(result.filePaths[0]);
                updateContextMenu();
              }
            })
            .catch((err) => {
              console.error(err);
            });
        },
      },
      { type: "separator" },
      ...folderMenuItems,
      { type: "separator" },
      {
        label: "Sair",
        click: () => {
          app.quit();
        },
      },
    ]);

    tray.setContextMenu(contextMenu);
  };

  updateContextMenu();
  tray.setToolTip("VsCode Launcher");
});
