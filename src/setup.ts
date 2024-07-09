import { app } from "electron";
import * as fs from "fs";

const userDataPath = app.getPath("userData");

if (!fs.existsSync(userDataPath)) {
  fs.mkdirSync(userDataPath, { recursive: true });
}
