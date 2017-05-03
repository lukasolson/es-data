const _ = require('lodash');
const Promise = require('bluebird');
const readFile = Promise.promisify(require('fs').readFile);

const index = 'snp';

const indexPromise = readFile('/Users/lukas/Development/es-data/snp/mappings.json', 'utf8').then(data => ({
  index,
  body: {
    mappings: JSON.parse(data)
  }
}));

const docsPromise = readFile('/Users/lukas/Development/es-data/snp/data/AncestryDNA.txt', 'utf8')
.then(data => getDocsFromTxt(index, 'ancestry', data));

function getDocsFromTxt(index, type, data) {
  const rows = data.split('\r\n')
  .filter(row => row.length > 0) // Remove empty lines
  .filter(row => row.charAt(0) !== '#') // Remove comment lines
  .map(row => row.split('\t'));

  const headers = rows[0];
  return rows.slice(1) // Remove header
  .map(row => _.zipObject(headers, row))
  .map((entry, i) => ({
    index,
    type,
    id: type + i,
    body: entry
  }));
}

module.exports = {indexPromise, docsPromise};
