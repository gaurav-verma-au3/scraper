import { executablePath } from "puppeteer";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import UserAgents from "user-agents";
import writeJSONFile from "../utils/writeJSONFile.js";
import { sleep } from "../utils/index.js";
import { downloadAndSaveImage } from "../utils/downloadAndSaveImage.js";
import { mkdir } from "fs/promises";

puppeteer.use(StealthPlugin());

const selectors = {
  searchInput: `#desktop-header-cnt > div.desktop-bound > div.desktop-query > input`,
  prevButton: `#desktopSearchResults > div.search-searchProductsContainer.row-base > section > div.results-showMoreContainer > ul > li.pagination-prev.pagination-disabled`,
  nextButton: `#desktopSearchResults > div.search-searchProductsContainer.row-base > section > div.results-showMoreContainer > ul > li.pagination-next`,
  productList: `#desktopSearchResults > div.search-searchProductsContainer.row-base > section > ul`,
  pageInfo: `#desktopSearchResults > div.search-searchProductsContainer.row-base > section > div.results-showMoreContainer > ul > li.pagination-paginationMeta`,
  productdetails: `#mountRoot > div > div:nth-child(1) > main > div.pdp-details.common-clearfix > div.pdp-description-container > div.pdp-productDescriptors > div > div:nth-child(1) > p`,
  sizeAndFit: "#mountRoot > div > div:nth-child(1) > main > div.pdp-details.common-clearfix > div.pdp-description-container > div.pdp-productDescriptors > div > div:nth-child(2) > p",
  specs: `#mountRoot > div > div:nth-child(1) > main > div.pdp-details.common-clearfix > div.pdp-description-container > div.pdp-productDescriptors > div > div.index-sizeFitDesc`,
  images: `#mountRoot > div > div:nth-child(1) > main > div.pdp-details.common-clearfix > div.image-grid-container.common-clearfix
`,
};

const myntra = async (query, location, connection) => {
  connection.send(`Starting process...`);

  try {
    await mkdir(location, { recursive: true });
    const browser = await puppeteer.launch({ executablePath: executablePath(), headless: false, args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--use-fake-ui-for-media-stream", "--auto-open-devtools-for-tabs"] });
    const pages = await browser.pages();
    const page = pages[0];
    // const userAgent = new UserAgents();
    // await page.setUserAgent(userAgent.toString());
    await page.setViewport({ width: 1280, height: 800 });
    await page.goto("https://myntra.com", { waitUntil: "networkidle2" });
    const searchInput = await page.waitForSelector(selectors.searchInput);
    await searchInput.focus();
    await page.keyboard.type(query);
    await page.keyboard.press("Enter");
    let enabled = true;
    await sleep(10000);
    while (enabled) {
      let count = 1;
      const hrefs = await page.evaluate((selectors) => {
        const list = document.querySelector(selectors.productList);
        console.log({ list });
        if (!list) return [];
        return Array.from(list.querySelectorAll("li.product-base a"))
          .map((a) => a.getAttribute("href"))
          .filter(Boolean);
      }, selectors);

      for (const pageUrl of hrefs) {
        const pageInfo = await page.waitForSelector(selectors.pageInfo);
        const text = await pageInfo.evaluate((el) => el.innerHTML);
        connection.send(`Processing product no ${count} of  ${text}`);
        await processProduct(browser, pageUrl, location);
        count += 1;
      }
      const next = await page.waitForSelector(selectors.nextButton);
      let nextClassList = await next.evaluate((el) => Array.from(el.classList));
      if (nextClassList.includes("pagination-disabled")) {
        enabled = false;
        break;
      } else {
        await next.click();
        console.log("Still enabled... waiting for it to be disabled");
        await sleep(5000);
      }
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
      if (!container) return null;
      const rows = container.querySelectorAll(".index-row");
      const specs = {};
      rows.forEach((row) => {
        const key = row.querySelector(".index-rowKey")?.innerText.trim();
        const value = row.querySelector(".index-rowValue")?.innerText.trim();
        if (key && value) specs[key] = value;
      });
      return specs;
    }, selectors);
    const imageUrls = await page.evaluate((selectors) => {
      const container = document.querySelector(selectors.images);
      if (!container) return [];
      return Array.from(container.querySelectorAll(".image-grid-image"))
        .map((div) => {
          const style = div.getAttribute("style");
          const match = /url\(["']?(.*?)["']?\)/.exec(style);
          return match ? match[1] : null;
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

export default myntra;
