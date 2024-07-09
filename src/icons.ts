import { nativeTheme } from "electron";
import * as path from "path";

const iconsDir = "icons";

enum IconType {
  Light = "light.png",
  Dark = "dark.png",
}

export enum Icon {
  App = "app.png",
  Add = "add",
  Close = "close",
  Delete = "delete",
  Edit = "edit",
  Favorite = "favorite",
  Directory = "directory",
}

const getIconWithTheme = (icon: Icon, iconType: IconType): string => {
  return path.join(__dirname, iconsDir, icon, iconType);
};

export const getIcon = (icon: Icon): string => {
  if (icon === Icon.App) {
    return path.join(__dirname, iconsDir, icon);
  }

  const iconType = nativeTheme.shouldUseDarkColors
    ? IconType.Dark
    : IconType.Light;

  return getIconWithTheme(icon, iconType);
};
