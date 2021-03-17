const cheerio = require('cheerio');
const Apify = require('apify');
const { scrapeUrls } = require('./getItems.js');

const { log, enqueueLinks } = Apify.utils;

const errorHandle = async (page, session, statusCode, response) => {
    // Loading cheerio for easy parsing, remove if you wish
    const html = await page.content();
    const $ = cheerio.load(html);
    // We handle this separately to get info
    if ($('[action="/errors/validateCaptcha"]').length > 0) {
        session.retire();
        throw `[CAPTCHA]: Status Code: ${response.statusCode}`;
    }

    if (html.toLowerCase().includes('robot check')) {
        session.retire();
        throw `[ROBOT CHECK]: Status Code: ${response.statusCode}.`;
    }

    if (!response || (statusCode !== 200 && statusCode !== 404)) {
        session.retire();
        throw `[Status code: ${statusCode}]. Retrying`;
    }
};

async function handlePageFunction({
    request, page, response, session, depthOfCrawl, requestQueue,
}) {
    // get and log category name
    const title = await page.title();
    const statusCode = await response.status();
    log.info(`Processing: ${title}. Depth: ${request.userData.depthOfCrawl},`
       + `is detail page: ${request.userData.detailPage} URL: ${request.url}`);

    // check if we have any issues accessing this page
    await errorHandle(page, session, statusCode, response);

    // Enqueue main category pages on the Best Sellers homepage
    if (!request.userData.detailPage) {
        await enqueueLinks({
            page,
            requestQueue,
            selector: 'div > ul > ul > li > a',
            transformRequestFunction: (req) => {
                req.userData.detailPage = true;
                req.userData.depthOfCrawl = 1;
                return req;
            },
        });
    }

    // Enqueue second subcategory level
    if (depthOfCrawl > 1 && request.userData.depthOfCrawl === 1) {
        await enqueueLinks({
            page,
            requestQueue,
            selector: 'ul > ul > ul > li > a',
            transformRequestFunction: (req) => {
                req.userData.detailPage = true;
                req.userData.depthOfCrawl = 2;
                return req;
            },
        });
    }

    // Enqueue 3rd subcategory level
    if ([4, 3].includes(depthOfCrawl) && request.userData.depthOfCrawl === 2) {
        await enqueueLinks({
            page,
            requestQueue,
            selector: 'ul > ul > ul > li > a',
            transformRequestFunction: (req) => {
                req.userData.detailPage = true;
                req.userData.depthOfCrawl = 3;
                return req;
            },
        });
    }

    if (depthOfCrawl === 4 && request.userData.depthOfCrawl === 3) {
        await enqueueLinks({
            page,
            requestQueue,
            selector: 'ul > ul > ul > li > a',
            transformRequestFunction: (req) => {
                req.userData.detailPage = true;
                req.userData.depthOfCrawl = 4;
                return req;
            },
        });
    }

    // Log number of pending URLs (works only locally)
    // log.info(`Pending URLs: ${reques;;tQueue.pendingCount}`);

    // Scrape items from enqueued pages
    if (request.userData.detailPage) {
        await scrapeUrls(page);
    }
}

module.exports = { handlePageFunction };
