const Apify = require('apify');

const { log } = Apify.utils;

async function scrapeDetailsPage(pageObj) {
    const resultsArr = [];
    // get page 1 url
    const page1Url = await pageObj.url();
    log.info(`this is the page1url: ${page1Url}`);
    resultsArr.push(page1Url);

    // Go to page 2 and scrape
    let nextPage;
    try {
        nextPage = await pageObj.waitForSelector('li.a-last > a');
    } catch (e) {
        log.error(`Could not extract second page - only one page returned. ${e}`);
    }
    if (nextPage) {
        await nextPage.click();
        await pageObj.waitForNavigation();
        const page2Url = await pageObj.url();
        resultsArr.push(page2Url);
        await Apify.pushData(resultsArr);
        log.info(`Saving results from ${page2Url}`);
    }
}

module.exports = { scrapeDetailsPage };
