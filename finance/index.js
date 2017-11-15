const _ = require('lodash');
const Promise = require('bluebird');
const readFile = Promise.promisify(require('fs').readFile);

const templatePromise = readFile('finance/mappings.json', 'utf8')
.then(json => ({
  name: 'finance',
  body: {
    template: 'finance',
    mappings: JSON.parse(json)
  }
}));

const docsPromise = readFile('finance/data/Transactions\ -\ Sheet1.tsv', 'utf8')
.then(tsv => getDocsFromTsv(tsv));

function getDocsFromTsv(tsv) {
  const rows = tsv.split('\r\n')
  .filter(row => row.length > 0) // Remove empty lines
  .map(row => row.split('\t'));

  const headers = rows[0].map(_.snakeCase);
  return rows.slice(1) // Remove header
  .map(row => _.zipObject(headers, row))
  .map(parseAmount)
  .map(randomAmount)
  .map(entry => addDateFields(entry, new Date(entry.date)))
  .map(entry => _.omit(entry, 'date'))
  .map((entry, i) => ({
    index: 'finance',
    type: 'transaction',
    id: i,
    body: entry
  }));
}

function parseAmount(entry) {
  const amount = parseFloat(
    entry.amount
    .split('(').join('-')
    .split(')').join('')
    .split(',').join('')
  );

  return Object.assign({}, entry, {amount});
}

function randomAmount(entry) {
  const multiplier = entry.amount < 0 ? -1 : 1;
  const amount = multiplier * _.random(0, 1000 * 100) / 100;
  return Object.assign({}, entry, {amount});
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

module.exports = {templatePromise, docsPromise};
