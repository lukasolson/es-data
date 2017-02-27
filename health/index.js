const _ = require('lodash');
const Promise = require('bluebird');
const readFile = Promise.promisify(require('fs').readFile);
const {toJson} = require("xml2json");

const index = 'health';

const indexPromise = readFile('/Users/lukas/Development/es-data/health/mappings.json', 'utf8').then(data => ({
  index,
  body: {
    mappings: JSON.parse(data)
  }
}));

const docsPromise = readFile('/Users/lukas/Development/es-data/health/data/export.xml', 'utf8')
.then(data => getDocsFromXml(index, data));

function getDocsFromXml(index, data) {
  const {HealthData} = toJson(data, {object: true});
  return _(HealthData)
  .pickBy(Array.isArray)
  .mapKeys(mapSnakeCase)
  .map((entries, type) => {
    return entries
    .map(entry => _.mapKeys(entry, mapSnakeCase))
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

function mapSnakeCase(value, key) {
  return _.snakeCase(key)
}

module.exports = {indexPromise, docsPromise};
