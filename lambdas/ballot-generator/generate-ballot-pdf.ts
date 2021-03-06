import chromium from 'chrome-aws-lambda';
import puppeteer from 'puppeteer-core';

// const BASE_URL = 'http://localhost:8000/generate-ballot';
const BASE_URL = 'https://paravotar.org/generate-ballot';

type GenerateBallotParams = {
  votes: string;
};

export default async function generateBallotPdf(votes: string) {
  try {
    const executablePath = await chromium.executablePath;
    const browser = await puppeteer.launch({
      args: chromium.args,
      executablePath,
    });
    const page = await browser.newPage();

    // Consider the page to be loaded after 500ms without any network requests.
    await page.goto(`${BASE_URL}?${votes}`, { waitUntil: 'networkidle0' });
    await page.waitFor('[data-state="success"]');

    // Get the "viewport" of the page, as reported by the page.
    const dimensions = await page.evaluate(() => {
      const container = document.querySelector('[data-state="success"]');

      if (container) {
        const ballot = container.children[0];

        return {
          width: ballot.clientWidth,
        };
      }

      return { width: 2200 };
    });

    let pdf = await page.pdf({
      printBackground: true,
      width: `${dimensions.width}px`,
    });

    await browser.close();

    return pdf;
  } catch (err) {
    console.log(err);
  }
}
