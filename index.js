require('dotenv').config();
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());
const {findArticleLink, findBooks} = require('./kobo.js');
const {listEvents, insertBookEvent} = require('./google-calendar.js');
const dayjs = require('dayjs');

(async () => {
    // const browser = await puppeteer.connect({
    //     browserWSEndpoint: 'ws://localhost:3000'
    // });
    // const page = await browser.newPage();

    // let link = findArticleLink(page);
    // if (!link) {
    //     console.log('error: can not find article link')
    //     return;
    // }
    let link = 'https://www.kobo.com/zh/blog/weekly-dd99-2024-w23';

    // console.log('find books in: ' + link)
    // let books = await findBooks(page, link);
    // if (!books.length) {
    //     console.log('error: no books');
    //     return;
    // }
    // console.log(`found ${books.length} books`);

    // const data = await page.screenshot({path: 'screenshot.jpg'});
    // browser.close();

    const books = [
        {
            id: 'c76c448cdc2ead5864ce05d838bc5462',
            date: 1718121600,
            title: '高效努力',
            description: '<p>你明明很努力，為什麼依然收效甚微？因為努力需要正確的方式。本書從心理學的角度切入，面對人生各式各樣的難題，幫助你直接複製強者經驗不走冤枉路，快速建立在30歲前就該懂的高效思維。</p><div><a href="https://www.kobo.com/tw/zh/ebook/dOKNiPtonTqZ6RNMc0jWRA">查看電子書</a></div><div>由 宋曉東◎著</div><div>出版社：<a href="https://www.kobo.com/tw/zh/search?query=%E9%87%87%E5%AF%A6%E6%96%87%E5%8C%96&amp;fcsearchfield=Imprint">采實文化</a></div><div><a href="https://www.kobo.com/zh/blog/weekly-dd99-2024-w23">Kobo Blog</a></div>'
        },
    ];

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
