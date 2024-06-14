require('dotenv').config();
const dayjs = require('dayjs');
const {listEvents} = require('./src/google-calendar.js');
const {getFilepath, writeJson} = require('./src/json-db.js');

(async () => {
    console.log(process.argv);
    let year = process.argv[2];
    if (!year) {
        console.log('please pass year argument');
        return;
    }

    const fromDate = dayjs().year(year).startOf('year');
    const toDate = dayjs().year(year).endOf('year');

    console.log(`list events from ${fromDate.format('YYYY-MM-DD')} to ${toDate.format('YYYY-MM-DD')}`);
    const events = await listEvents(fromDate.unix(), toDate.unix());
    console.log(`${events.length} events exists`);

    const books = events.map(event => {
        let date = dayjs(event.start.date, 'YYYY-MM-DD').startOf('day');
        return {
            id: event.extendedProperties?.shared?.id,
            timestamp: date.unix(),
            dateLocal: date.format('YYYY-MM-DD'),
            title: event.summary,
            description: event.description,
            meta: event.extendedProperties?.shared?.meta || {},
        };
    });

    const filepath = getFilepath(year);
    writeJson(filepath, books);
    console.log(`${filepath} saved ${books.length} books`);
})();