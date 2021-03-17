const Apify = require('apify');

const { log } = Apify.utils;

async function scrapeDetailsPage(pageObj) {
    const resultsArr = [];
    // get page 1 url
    const page1Url = {url: await pageObj.url()};
    log.info(`this is the page1url: ${page1Url}`);
    resultsArr.push(page1Url);

    // Go to page 2 and scrape
    let nextPage;
    try {
        nextPage = await pageObj.waitForSelector('li.a-last > a');
    } catch (e) {
        log.error(`Could not extract second page - only one page returned. ${e}`);
    }
    log.info('there was a next page')
    if (nextPage) {
      log.info('we are clicking and going')
        await nextPage.click();
        await pageObj.waitForNavigation();
        const page2Url = await pageObj.url();
        log.info('we got page 2 and are pushing')
        resultsArr.push({url: page2Url});
        log.info('we are pushing to apify')
        await Apify.pushData(resultsArr);
        log.info(`Saving results from ${page2Url}`);
    }
}

module.exports = { scrapeDetailsPage };
