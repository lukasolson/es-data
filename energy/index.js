const _ = require('lodash');
const Promise = require('bluebird');
const readFile = Promise.promisify(require('fs').readFile);

const index = 'energy';

const indexPromise = readFile('/Users/lukas/Development/es-data/energy/mappings.json', 'utf8').then(data => ({
  index,
  body: {
    mappings: JSON.parse(data)
  }
}));

const docsPromise = Promise.all([
  readFile('/Users/lukas/Development/es-data/energy/data/Electricity\ -\ Sheet1.tsv', 'utf8').then(data => getDocsFromTsv(index, 'electricity', data)),
  readFile('/Users/lukas/Development/es-data/energy/data/Weather\ -\ Sheet1.tsv', 'utf8').then(data => getDocsFromTsv(index, 'weather', data))
])
.then(entries => _.flatten(entries));

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
    day: date.getDay(),
    hours: date.getHours()
  });
}

module.exports = {indexPromise, docsPromise};
