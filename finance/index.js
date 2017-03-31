const _ = require('lodash');
const Promise = require('bluebird');
const readFile = Promise.promisify(require('fs').readFile);

const index = 'finance';

const indexPromise = readFile('/Users/lukas/Development/es-data/finance/mappings.json', 'utf8').then(data => ({
  index,
  body: {
    mappings: JSON.parse(data)
  }
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
  .map(entry => _.assign({}, entry, {amount: randomAmount(entry.amount < 0)}))
  .map(entry => addDateFields(entry, new Date(entry.date)))
  .map((entry, i) => ({
    index,
    type,
    id: type + i,
    body: entry
  }));
}

function randomAmount(negative) {
  return _.random(0, 1000 * 100) / 100 * (negative ? -1 : 1);
}

function addDateFields(entry, date) {
  return Object.assign({}, entry, {
    '@timestamp': date.toISOString(),
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day_of_month: date.getDate(),
    day_of_week: date.getDay()
  });
}

module.exports = {indexPromise, docsPromise};
