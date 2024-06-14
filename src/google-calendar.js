const {GoogleAuth} = require('google-auth-library');
const dayjs = require('dayjs');

let googleClient;
const getClient = async function () {
    if (googleClient) return googleClient;

    const auth = new GoogleAuth({
        scopes: 'https://www.googleapis.com/auth/calendar',
        keyFile: process.env.GOOGLE_KEY_FILE,
        // credentials: process.env.GOOGLE_CLOUD_CREDENTIALS,
    });
    googleClient = await auth.getClient();
    return googleClient;
};

const fetch = async function (path, query = {}, options = {}) {
    let base = 'https://www.googleapis.com/calendar/v3/calendars/' + process.env.CALENDAR_ID;
    let searchParams = (new URLSearchParams(query)).toString();
    let url = path ? base + '/' + path : base;
    if (searchParams) {
        url += '?' + searchParams;
    }

    // https://github.com/googleapis/gaxios
    let client = await getClient();
    const res = await client.request({ url, ...options });
    return res.data;
}

module.exports.listEvents = async function (fromUnix, toUnix) {
    if (fromUnix > toUnix) {
        [toUnix, fromUnix] = [fromUnix, toUnix];
    }
    let timeMin = dayjs.unix(fromUnix).startOf('day').toISOString();
    let timeMax = dayjs.unix(toUnix).endOf('day').toISOString();

    let data = await fetch('events', {
        timeMin,
        timeMax,
        singleEvents: true,
        orderBy: 'startTime',
    });
    return data.items || [];
};

module.exports.insertBookEvent = async function (book) {
    let date = dayjs.unix(book.timestamp);

    const data = {
        summary: book.title,
        description: book.description,
        start: {
            date: date.format('YYYY-MM-DD'),
            timeZone: 'Asia/Taipei',
        },
        end: {
            date: date.add(1, 'day').format('YYYY-MM-DD'),
            timeZone: 'Asia/Taipei',
        },
        extendedProperties: {
            shared: {
                id: book.id,
                meta: book.meta,
            }
        }
    };

    return await fetch('events', {}, {
        method: 'POST',
        data,
    });
};
