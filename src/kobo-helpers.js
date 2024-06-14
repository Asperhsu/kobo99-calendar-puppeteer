const crypto = require('crypto');
const dayjs = require('dayjs');

module.exports = {
    parseDateFromText(text) {
        let currentMonth = dayjs().month() + 1;
        let re = new RegExp('^([0-9]{1,2}\/[0-9]{1,2})');

        try {
            let found = text.match(re);
            if (!found) return null;

            let [month, day] = found[1].split('/').map(val => parseInt(val, 10));
            let date = dayjs().startOf('day').month(month - 1).date(day);

            if (currentMonth === 12 && month === 1) {
                date = date.add(1, 'year');
            }

            return date;
        } catch (err) {
            return null;
        }
    },
    findBookTitle(text) {
        var re = new RegExp('《(.+)》');
        try {
            let found = text.match(re);
            return found ? found[1] : null;
        } catch (err) {
            return null;
        }
    },
    removeUrlParams(link) {
        var pos = link.indexOf('?');
        return pos > 0 ? link.substring(0, pos) : link;
    },
    md5(value) {
        return crypto.createHash('md5').update(value).digest("hex");
    },
};