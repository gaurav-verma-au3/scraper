import { executablePath } from "puppeteer";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import UserAgents from "user-agents";
import writeJSONFile from "../utils/writeJSONFile.js";
import { sleep } from "../utils/index.js";
import { downloadAndSaveImage } from "../utils/downloadAndSaveImage.js";
import { mkdir } from "fs/promises";
import getQueryParams from "../utils/getQueryParams.js";

const selectors = {
  searchInput: `#headerMenu > div.css-1q0ywzx > div > div > form > input`,
  footerDiv: `#mainContent > div > div:nth-child(2)`,
  productList: `main > div > div:nth-child(1) > div:nth-child(3) > div:nth-child(2) > div:nth-child(2)`,
  productdetails: `main > div:nth-child(1) > div:nth-child(2) > div:nth-child(2) > div > div:nth-child(1) > div:nth-child(2) > div:nth-child(2) > div > div > div > div > p`,
  sizeAndFit: "main > div:nth-child(1) > div:nth-child(2) > div:nth-child(2) > div > section > div:nth-child(7) > div:nth-child(2) > div:nth-child(2) > div",
  specs: `main > div:nth-child(1) > div:nth-child(2) > div:nth-child(2) > div > div:nth-child(1) > div:nth-child(2) > div:nth-child(1) > div > div > div:nth-child(1) > div`,
  images: `main > div:nth-child(1) > div:nth-child(2) > div:nth-child(1) > div:nth-child(1) > div > div`,
};

puppeteer.use(StealthPlugin());

const nykaa = async (query, location, connection) => {
  connection.send(`Starting process...`);

  try {
    await mkdir(location, { recursive: true });

    const browser = await puppeteer.launch({ executablePath: executablePath(), headless: false, args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--use-fake-ui-for-media-stream", "--auto-open-devtools-for-tabs"] });
    const pages = await browser.pages();
    const page = pages[0];
    // const userAgent = new UserAgents();
    // await page.setUserAgent(userAgent.toString());
    await page.setViewport({ width: 1280, height: 800 });
    await page.setRequestInterception(true);
    let enabled = true;
    let totalCount = 0;
    let currentCount = 1;
    const hrefs = [];
    page.on("request", (request) => {
      request.continue(); // Let the request continue (mandatory when interception is on)
    });
    page.on("response", async (response) => {
      const url = response.url();
      const query = getQueryParams(url);
      const PageSize = query?.PageSize ? Number(query?.PageSize) : 0;

      // OPTIONAL: get response body for specific API
      if (url.includes("V2/categories/products") && response.request().method() === "GET") {
        try {
          const body = await response.json();
          totalCount = body?.response?.count;
          const products = body?.response?.products;
          const isLast = products.length < PageSize;
          for (const product of products) {
            hrefs.push(product?.actionUrl);
          }
          if (isLast) {
            enabled = false;
          }
        } catch (err) {
          console.error(`Error reading response body from ${url}:`, err);
        }
      }
    });

    await page.setViewport({ width: 1280, height: 800 });
    await page.goto("https://www.nykaafashion.com/", { waitUntil: "networkidle2" });
    const searchInput = await page.waitForSelector(selectors.searchInput);
    await searchInput.focus();
    await page.keyboard.type(query);
    await page.keyboard.press("Enter");

    await sleep(10000);
    while (enabled) {
      await page.evaluate((selectors) => {
        const element = document.querySelector(selectors.footerDiv);
        if (element) element.scrollIntoView({ behavior: "smooth", block: "center" });
      }, selectors);
    }

    for (const url of hrefs) {
      connection.send(`Processing product no ${currentCount} of  ${totalCount}`);
      await processProduct(browser, url, location);
      currentCount += 1;
    }

    await page.close();
    await browser.close();
  } catch (error) {
    console.log({ error });
    return;
  }
};

const processProduct = async (browser, url, location) => {
  const filePath = `${location}/metadata.json`;
  try {
    const page = await browser.newPage();
    await page.goto(`https://www.myntra.com/${url}`, { waitUntil: "domcontentloaded" });
    const productDetails = await page.evaluate((selectors) => document.querySelector(selectors.productdetails)?.innerText?.trim(), selectors);
    const sizeAndFit = await page.evaluate((selectors) => document.querySelector(selectors.sizeAndFit)?.innerText?.trim(), selectors);
    const specs = await page.evaluate((selectors) => {
      const container = document.querySelector(selectors.specs);
      if (!container) return {};

      const rows = container.querySelectorAll(".css-134y3ft");
      const result = {};

      rows.forEach((row) => {
        const key = row.querySelector(".attribute-key")?.innerText?.trim();
        const value = row.querySelector(".attribute-value")?.innerText?.trim();
        if (key && value) result[key] = value;
      });

      return result;
    }, selectors);
    const imageUrls = await page.evaluate((selectors) => {
      const container = document.querySelector(selectors.images);
      if (!container) return [];
      return Array.from(container.querySelectorAll("img"))
        .map((img) => {
          try {
            const rawUrl = img.getAttribute("src") || "";
            return new URL(rawUrl.split("?")[0]).href;
          } catch (e) {
            console.log({ e });
            return false;
          }
        })
        .filter(Boolean);
    }, selectors);
    for (const url of imageUrls) {
      try {
        const fileName = await downloadAndSaveImage(url, location);
        await writeJSONFile(filePath, {
          productDetails,
          sizeAndFit,
          specs,
          fileName,
        });
      } catch (err) {
        console.error(`Failed to download ${url}: ${err.message}`);
      }
    }
    await page.close();
  } catch (error) {
    console.error(`Failed to download ${url}: ${error.message}`);
  }
};

export default nykaa;
