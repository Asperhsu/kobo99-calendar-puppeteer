const helpers = require('./kobo-helpers.js');

module.exports.findArticleLink = async function (page) {
    await page.goto('https://www.kobo.com/zh/blog', {
        waitUntil: 'load',
    });

    let links = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('.card:has(.card__title)')).filter(el => {
            return el.querySelector('.card__title').innerText.includes('一週99');
        }).map(el => {
            return el.querySelector('a.card__link').href;
        });
    });

    return links.length && links[0] ? links[0] : null;
};

/** detail */

const findContentInfos = async function (page) {
    return (await page.evaluate(() => {
        return Array.from(document.querySelectorAll('.content-block')).filter(el => {
            return el.innerText.includes('選書');
        }).map(el => {
            return {
                title: el.querySelector('h3')?.innerText,
                intro: el.querySelector('p, div')?.innerText,
            };
        });
    })).map(function (info, i) {
        let date = helpers.parseDateFromText(info.title);
        let title = helpers.findBookTitle(info.title);
        return date && title ? {date, title, intro: info.intro} : null;
    }).filter(info => !!info);
};

const findBookInfos = async function (page) {
    return (await page.evaluate(() => {
        return Array.from(document.querySelectorAll('.book-block')).map(el => {
            return {
                title: el.querySelector('.title')?.innerText,
                link: el.querySelector('a')?.href,
                author: el.querySelector('.author')?.innerText,
                infos: Array.from(el.querySelectorAll('p')).map(el => {
                    return el.innerHTML;
                }),
            };
        });
    })).map(info => {
        info.title = helpers.findBookTitle(info.title);
        info.link = helpers.removeUrlParams(info.link);
        return info;
    });
};

module.exports.findBooks = async function (page, link) {
    await page.goto(link, {
        waitUntil: 'load',
    });

    let contentInfos = await findContentInfos(page);
    let bookInfos = await findBookInfos(page);

    let books = contentInfos.map(({date, title, intro}) => {
        let bookInfo = bookInfos.find(info => info.title === title);
        if (!bookInfo) return null;

        return {
            id: helpers.md5(bookInfo.link),
            date: date.unix(),
            title,
            description: [
                intro ? `<p>${intro}</p>` : null,
                `<div><a href="${bookInfo.link}">查看電子書</a></div>`,
                bookInfo.author ? `<div>${bookInfo.author}</div>` : null,
                ...bookInfo.infos.map(info => `<div>${info}</div>`),
                `<div><a href="${link}">Kobo Blog</a></div>`,
            ].filter(desc => !!desc).join(''),
        };
    }).filter(book => !!book);
    // console.log(books);
    return books;
};
