const _ = require('lodash');
const path = require('path');
const fs = require('fs');
const {indexDocs} = require('../indexer');

const index = 'finance';
const type = 'transaction';
const filename = path.resolve(__dirname, 'data', 'Financial Transactions - Sheet1.tsv');

fs.readFile(filename, 'utf8', indexFile);

function indexFile(err, tsv) {
  const rows = (
    tsv.split('\r\n')
    .filter(row => row.length > 0) // Remove empty lines
    .map(row => row.split('\t'))
  );
  const headers = rows[0].map(_.snakeCase);
  indexDocs(
    rows.slice(1) // Remove header
    .map(row => _.zipObject(headers, row))
    .map(parseAmount)
    .map(addTimestamp)
    .map((body, i) => ({index, id: i, type, body}))
  );
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

function addTimestamp(entry) {
  const timestamp = new Date(entry.date).toISOString();
  return Object.assign({}, entry, {timestamp});
}
