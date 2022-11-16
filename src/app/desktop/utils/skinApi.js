import { ipcRenderer } from "electron";
import path from "path";
import fs from "fs";
import { mcGetPlayerSkin } from "../../../common/api";

const defaultConfig = [];
let config = undefined;

export async function getSkinPath() {
  const userData = await ipcRenderer.invoke("getUserData");
  const folder = path.join(userData, "skins");

  if (!fs.existsSync(folder)) fs.mkdirSync(folder, {recursive: true});

  return {
    skinsFolder: folder,
    skinsFile: path.join(folder, "skins.json")
  };
}

export async function writeConfig(content, file = undefined) {
  if (file === undefined) file = (await getSkinPath()).skinsFile;
  await fs.promises.writeFile(file, JSON.stringify(content, undefined, 2));
  config = content;
}

export async function getConfig() {
  if (config !== undefined) return config;

  async function useDefaultConfig() {
    console.warn("Falling back to default config...");
    await writeConfig(defaultConfig, skinsFile);
    return defaultConfig;
  }

  const {skinsFile} = await getSkinPath();

  const exists = fs.existsSync(skinsFile);

  if (exists) {
    const f = await fs.promises.readFile(skinsFile);

    try {
      const content = f.toString();
      const jsonContent = JSON.parse(content);
      if (Array.isArray(jsonContent)) {
        await writeConfig(jsonContent, skinsFile);
        return jsonContent;
      } else {
        console.warn("Skin file is not an array");
      }
    } catch (err) {
      console.warn(err);
    }
  }
  return useDefaultConfig();
}

export async function getAvailableSkins() {
  const {skinsFolder} = await getSkinPath();
  return await fs.promises.readdir(skinsFolder);
}

