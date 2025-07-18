/* eslint-disable no-useless-catch */
import axios from "axios";
import fs from "fs/promises";
import path from "path";

const getFilenameFromUrl = (url) => {
  const parsedUrl = new URL(url);
  return path.basename(parsedUrl.pathname).split("?")[0]; // Clean query params
};

export const downloadAndSaveImage = async (url, dir) => {
  try {
    const fileName = getFilenameFromUrl(url);
    const filepath = path.join(dir, fileName);
    const response = await axios.get(url, { responseType: "arraybuffer" });
    await fs.writeFile(filepath, response.data);
    return fileName;
  } catch (error) {
    console.error(error);
  }
};
