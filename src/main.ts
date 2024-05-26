import { app, Tray, BrowserWindow, nativeTheme } from "electron";
import * as path from "path";
import { updateContextMenu } from "./contextMenu";
import * as dotenv from "dotenv";

dotenv.config();

app.on("ready", () => {
  const icon = path.join(__dirname, "icons", "app.png");

  new BrowserWindow({
    icon,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });

  const tray = new Tray(icon);
  tray.setToolTip("VsCode Launcher");

  updateContextMenu(tray);

  nativeTheme.on("updated", async () => {
    await updateContextMenu(tray);
  });
});
