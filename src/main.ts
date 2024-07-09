import { app, Tray, BrowserWindow, nativeTheme } from "electron";
import * as path from "path";
import { updateContextMenu } from "./contextMenu";
import { Icon, getIcon } from "./icons";
import "./setup";

app.on("ready", () => {
  const icon = getIcon(Icon.App);

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
