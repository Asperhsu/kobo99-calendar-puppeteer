const fs = require('node:fs');

module.exports.appendBooks = async function (books, year) {
    const filepath = getFilepath(year);

    let existsBooks = readJson(filepath) || [];
    if (!books.length) {
        return existsBooks;
    }

    let nonExistsBooks = books.filter(book => {
        return !existsBooks.find(existBook => book.id === existBook.id);
    });
    existsBooks = existsBooks.concat(nonExistsBooks);

    writeJson(filepath, existsBooks);
    return existsBooks;
}

function getFilepath(year) {
    year = year || (new Date).getFullYear();
    return `json/books-${year}.json`;
}
module.exports.getFilepath = getFilepath;

function fileExists(filepath) {
    try {
        fs.accessSync(filepath, fs.constants.R_OK);
        return true;
    } catch (err) {
        return false;
    }
}
module.exports.fileExists = fileExists;

function readJson(filepath) {
    if (!fileExists(filepath)) {
        return null;
    }

    const content = fs.readFileSync(filepath, { encoding: 'utf8', flag: 'r' });
    return JSON.parse(content);
}
module.exports.readJson = readJson;

function writeJson(filepath, data) {
    let json = JSON.stringify(data, null, 2);
    fs.writeFileSync(filepath, json);
}
module.exports.writeJson = writeJson;