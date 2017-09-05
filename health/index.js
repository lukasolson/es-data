const _ = require('lodash');
const Promise = require('bluebird');
const readFile = Promise.promisify(require('fs').readFile);
const {toJson} = require('xml2json');

const templatePromise = readFile('health/mappings.json', 'utf8')
.then(json => ({
  name: 'health',
  body: {
    template: `health-*`,
    mappings: JSON.parse(json)
  }
}));

const docsPromise = readFile('health/data/apple_health_export/export.xml', 'utf8')
.then(xml => getDocsFromXml(xml));

function getDocsFromXml(xml) {
  const {HealthData} = toJson(xml, {object: true});
  return _(HealthData.Record)
  .map(entry => _.mapKeys(entry, mapKeysToSnakeCase))
  .map(entry => addDateFields(entry, new Date(entry.date_components || entry.start_date)))
  .map((entry, i) => ({
    index: `health-${entry.year}-${entry.month}-${entry.day_of_month}`,
    type: 'record',
    id: i,
    body: entry
  }))
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

module.exports = {templatePromise, docsPromise};
