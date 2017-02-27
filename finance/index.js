const _ = require('lodash');
const Promise = require('bluebird');
const readFile = Promise.promisify(require('fs').readFile);

const index = 'finance';

const indexPromise = readFile('/Users/lukas/Development/es-data/finance/mappings.json', 'utf8').then(data => ({
  index
}));

const docsPromise = readFile('/Users/lukas/Development/es-data/finance/data/Transactions\ -\ Sheet1.tsv', 'utf8')
.then(data => getDocsFromTsv(index, 'transaction', data));

function getDocsFromTsv(index, type, data) {
  const rows = data.split('\r\n')
  .filter(row => row.length > 0) // Remove empty lines
  .map(row => row.split('\t'));

  const headers = rows[0].map(_.snakeCase);
  return rows.slice(1) // Remove header
  .map(row => _.zipObject(headers, row))
  .map(entry => addDateFields(entry, new Date(entry.date)))
  .map((entry, i) => ({
    index,
    type,
    id: type + i,
    body: entry
  }));
}

function addDateFields(entry, date) {
  return _.assign({}, entry, {
    '@timestamp': date.toISOString(),
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    date: date.getDate(),
    day: date.getDay()
  });
}

module.exports = {indexPromise, docsPromise};