const _ = require('lodash');
const Promise = require('bluebird');
const readFile = Promise.promisify(require('fs').readFile);
const {toJson} = require('xml2json');

const index = 'health';

const indexPromise = readFile('/Users/lukas/Development/es-data/health/mappings.json', 'utf8').then(data => ({
  index,
  body: {
    mappings: JSON.parse(data)
  }
}));

const docsPromise = readFile('/Users/lukas/Development/es-data/health/data/apple_health_export/export.xml', 'utf8')
.then(data => getDocsFromXml(index, data));

function getDocsFromXml(index, data) {
  const {HealthData} = toJson(data, {object: true});
  return _(HealthData)
  .pickBy(Array.isArray)
  .mapKeys(mapKeysToSnakeCase)
  .map((entries, type) => {
    return entries
    .map(entry => _.mapKeys(entry, mapKeysToSnakeCase))
    .map(entry => addDateFields(entry, new Date(entry.date_components || entry.start_date)))
    .map((entry, i) => ({
      index,
      type,
      id: type + i,
      body: entry
    }));
  })
  .flatten()
  .value();
}

function mapKeysToSnakeCase(value, key) {
  return _.snakeCase(key);
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
