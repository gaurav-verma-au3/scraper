/* eslint-disable no-unused-vars */
import { writeFile, readFile, mkdir, access } from "fs/promises";
import { dirname } from "path";
import { constants } from "fs";

async function writeJSONFile(filePath, data) {
  try {
    // Ensure directory exists
    await mkdir(dirname(filePath), { recursive: true });
    let dataArray = [];
    // Check if file exists

    try {
      await access(filePath, constants.F_OK);
    } catch (e) {
      console.log("file doesnt exists creting empty file");
      await writeFile(filePath, JSON.stringify([]));
    }
    try {
      const fileContents = await readFile(filePath, "utf8");
      const parsed = JSON.parse(fileContents);
      await writeFile(filePath, JSON.stringify([...parsed, data], null, 2), "utf8");
      console.log("Data successfully saved to", filePath);
    } catch (err) {
      console.error(err);
    }
    return true;
  } catch (err) {
    console.error(err);
  }
}
export default writeJSONFile;
