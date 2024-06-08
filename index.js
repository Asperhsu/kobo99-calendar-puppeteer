require('dotenv').config();
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());
const {findArticleLink, findBooks} = require('./kobo.js');
const {listEvents, insertBookEvent} = require('./google-calendar.js');
const dayjs = require('dayjs');

(async () => {
    const browser = await puppeteer.connect({
        browserWSEndpoint: 'ws://127.0.0.1:3000'
    });
    const page = await browser.newPage();

    let link = await findArticleLink(page);
    if (!link) {
        console.log('error: can not find article link');
        browser.close();
        return;
    }

    console.log('find books in: ' + link)
    let books = await findBooks(page, link);
    if (!books.length) {
        console.log('error: no books');
        browser.close();
        return;
    }
    browser.close();

    console.log(`found ${books.length} books`);
    const bookDateUnixs = books.map(book => book.date).sort((a, b) => a - b);
    const fromUnix = bookDateUnixs[0];
    const toUnix = bookDateUnixs[bookDateUnixs.length - 1];

    console.log(`list events from ${dayjs.unix(fromUnix).format('YYYY-MM-DD')} to ${dayjs.unix(toUnix).format('YYYY-MM-DD')}`);
    const events = await listEvents(fromUnix, toUnix);
    console.log(`${events.length} events exists`);

    // check exists
    for (let book of books) {
        let event = events.find(event => {
            let id = event.extendedProperties?.shared?.id;
            return id == book.id;
        });

        if (!event) {
            const data = await insertBookEvent(book);
            console.log('Event created: %s', data.summary);
        }
    }
})();
