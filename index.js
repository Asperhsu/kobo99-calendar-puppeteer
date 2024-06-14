require('dotenv').config();
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());
const {findArticleLink, findBooks} = require('./src/kobo.js');
const {appendBooks, getFilepath} = require('./src/json-db.js');
const {listEvents, insertBookEvent} = require('./src/google-calendar.js');
const {upload} = require('./src/github.js');
const dayjs = require('dayjs');

(async () => {
    const books = await getBooks();
    if (!books.length) return;

    await updateGoogleCalendar(books);

    let year = (new Date).getFullYear();
    await appendBooks(books, year);

    const filepath = getFilepath(year);
    await upload(filepath);
})();

async function getBooks() {
    let browser;
    let books = [];

    try {
        browser = await puppeteer.connect({
            browserWSEndpoint: 'ws://127.0.0.1:3000'
        });
    } catch (err) {
        console.log(err.message);
        return books;
    }

    const page = await browser.newPage();

    let link = await findArticleLink(page);
    if (!link) {
        console.log('error: can not find article link');
        browser.close();
        return books;
    }

    console.log('find books in: ' + link)
    books = await findBooks(page, link);
    if (!books.length) {
        console.log('error: no books');
        browser.close();
        return books;
    }

    console.log(`found ${books.length} books`);
    browser.close();
    return books;
}

async function updateGoogleCalendar(books) {
    const bookTimestamps = books.map(book => book.timestamp).sort((a, b) => a - b);
    const fromTimestamp = bookTimestamps[0];
    const toTimestamp = bookTimestamps[bookTimestamps.length - 1];
    const timestampToHuman = (timestamp) => {
        return dayjs.unix(timestamp).format('YYYY-MM-DD');
    };

    console.log(`list events from ${timestampToHuman(fromTimestamp)} to ${timestampToHuman(toTimestamp)}`);
    const events = await listEvents(fromTimestamp, toTimestamp);
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
}