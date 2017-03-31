const _ = require('lodash');
const Promise = require('bluebird');
const readFile = Promise.promisify(require('fs').readFile);

const index = 'weather';

const indexPromise = readFile('/Users/lukas/Development/es-data/weather/mappings.json', 'utf8').then(data => ({
  index,
  body: {
    mappings: JSON.parse(data)
  }
}));

const docsPromise = readFile('/Users/lukas/Development/es-data/weather/data/weather.txt', 'utf8')
.then(data => getDocsFromTxt(index, 'observation', data));

function getDocsFromTxt(index, type, data) {
  return data.split('\n')
  .filter(row => row.length > 0) // Remove empty lines
  .map(row => JSON.parse(row))
  .map(entry => addDateFields(entry, new Date(entry.date)))
  .map(entry => parseNumericFields(entry, ['temp', 'windchill', 'dew_point', 'humidity', 'pressure', 'visibility', 'wind_speed', 'gust_speed', 'precip', 'heat_index']))
  .map(entry => removeEmptyFields(entry))
  .map((entry, i) => ({
    index,
    type,
    id: type + i,
    body: entry
  }));
}

function addDateFields(entry, date) {
  return Object.assign({}, entry, {
    '@timestamp': date.toISOString(),
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day_of_month: date.getDate(),
    day_of_week: date.getDay(),
    hours: date.getHours()
  });
}

function parseNumericFields(entry, fields) {
  return _.mapValues(entry, (value, key) => {
    const parsed = parseFloat(value) || null;
    return fields.includes(key) ? parsed : value;
  });
}

function removeEmptyFields(entry) {
  return _.omitBy(entry, value => ['-', '', null].includes(value));
}

module.exports = {indexPromise, docsPromise};
