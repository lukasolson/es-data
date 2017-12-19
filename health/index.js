const path = require('path');
const fs = require('fs');
const {mapKeys, snakeCase} = require('lodash');
const {toJson} = require('xml2json');
const {indexDocs} = require('../indexer');

const index = 'health';
const type = 'record';
const filename = path.resolve(__dirname, 'data', 'apple_health_export', 'export.xml');

fs.readFile(filename, 'utf8', indexFile);

function indexFile(err, xml) {
  const {HealthData} = toJson(xml, {object: true});
  indexDocs(
    HealthData.Record
    .map(normalizeKeys)
    .map(addTimestamp)
    .map((body, i) => ({index, type, id: i, body}))
  );
}

function normalizeKeys(entry) {
  return mapKeys(entry, (value, key) => snakeCase(key));
}

function addTimestamp(entry) {
  const timestamp = new Date(entry.start_date).toISOString();
  return Object.assign({}, entry, {timestamp});
}
