const {resolve} = require('path');
const {readFile} = require('fs');
const {mapKeys, snakeCase, assign} = require('lodash');
const {parse} = require('papaparse');
const {indexDocs} = require('../indexer');

const index = 'finance';
const type = 'transaction';
const filename = resolve(__dirname, 'data', 'Financial Transactions - Sheet1.tsv');

readFile(filename, 'utf8', (err, tsv) => {
  if (err) throw err;
  indexFile(tsv);
});

function indexFile(tsv) {
  const {data} = parse(tsv, {header: true});
  indexDocs(
    data.map(normalizeKeys)
    .map(parseAmount)
    .map(addTimestamp)
    .map(body => ({index, type, body}))
  );
}

function normalizeKeys(entry) {
  return mapKeys(entry, (value, key) => snakeCase(key));
}

function parseAmount(entry) {
  const amount = parseFloat(
    entry.amount
    .split('(').join('-')
    .split(')').join('')
    .split(',').join('')
  );
  return assign({}, entry, {amount});
}

function addTimestamp(entry) {
  const timestamp = new Date(entry.date).toISOString();
  return assign({}, entry, {timestamp});
}
