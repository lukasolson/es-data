const {resolve} = require('path');
const {readFile} = require('fs');
const {mapKeys, mapValues, snakeCase} = require('lodash');
const {toJson} = require('xml2json');
const {indexDocs} = require('../indexer');

const index = 'health';
const type = 'record';
const filename = resolve(__dirname, 'data', 'apple_health_export', 'export.xml');

readFile(filename, 'utf8', (err, xml) => {
  if (err) throw err;
  indexFile(xml);
});

function indexFile(xml) {
  const {HealthData} = toJson(xml, {
    object: true,
    coerce: true,
  });
  indexDocs(
    HealthData.Record.map(normalizeKeys)
    .map(addTimestamp)
    .map((body, i) => ({index, type, id: i, body}))
  );
}

function normalizeKeys(entry) {
  return mapKeys(entry, (value, key) => snakeCase(key));
}

function addTimestamp(entry) {
  const timestamp = new Date(entry.start_date).toISOString();
  return {...entry, '@timestamp': timestamp};
}
