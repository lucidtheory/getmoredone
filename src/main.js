const Apify = require('apify');

const { log } = Apify.utils;
const { handlePageFunction } = require('./handlePageFunction.js');

// 1. Build an array of links
// 2. Get the entry link (Books Category)
// 3. Start a result array
// 4. Add this link and second page if there is one
// 5. Add all the first teir sub links to the queue to be scraped
// 6. Keep going from there.
// 7. Return the results

Apify.main(async () => {
    const requestQueue = await Apify.openRequestQueue(); // Starts the queue
    const input = await Apify.getValue('INPUT'); // Gets our Book Category link

    const { proxy, domain, categoryUrls, depthOfCrawl } = input;
    // Select which domain to scrape
    if (categoryUrls && categoryUrls.length > 0) {
        for (const categoryRequest of categoryUrls) {
            await requestQueue.addRequest({
                url: categoryRequest.url,
                userData: { detailPage: true, depthOfCrawl: 1 },
            }); // we it is not detail but it is how it was :)
        }
    } else {
        await requestQueue.addRequest({ url: domain });
    }

    const proxyConfiguration = await Apify.createProxyConfiguration(proxy);

    const crawler = new Apify.PuppeteerCrawler({
        maxRequestRetries: 15,
        maxConcurrency: 10, // To prevent too many browser activity
        requestQueue,
        proxyConfiguration,
        useSessionPool: true,
        launchPuppeteerOptions: {
            headless: true,
            stealth: true,
            useChrome: false,
            stealthOptions: {
                addPlugins: false,
                emulateWindowFrame: false,
                emulateWebGL: false,
                emulateConsoleDebug: false,
                addLanguage: false,
                hideWebDriver: true,
                hackPermissions: false,
                mockChrome: false,
                mockChromeInIframe: false,
                mockDeviceMemory: false,
            },
        },
        handlePageFunction: args => handlePageFunction({
            depthOfCrawl, requestQueue, ...args,
        }),
    });

    await crawler.run();
    log.info('Crawl complete.');
});
