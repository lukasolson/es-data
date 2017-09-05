const _ = require('lodash');
const Promise = require('bluebird');
const readFile = Promise.promisify(require('fs').readFile);

const templatePromise = readFile('/Users/lukas/Development/es-data/snp/mappings.json', 'utf8').then(json => ({
  name: 'snp',
  body: {
    template: 'snp',
    mappings: JSON.parse(json)
  }
}));

const docsPromise = readFile('snp/data/genome_LUKAS_OLSON_v4_Full_20170408071231.txt', 'utf8')
.then(data => getDocsFromTxt(data));

function getDocsFromTxt(data) {
  const rows = data.split('\r\n')
  .filter(row => row.length > 0) // Remove empty lines
  .filter(row => row.charAt(0) !== '#') // Remove comment lines
  .map(row => row.split('\t'));

  const headers = rows[0];
  return rows.slice(1) // Remove header
  .map(row => _.zipObject(headers, row))
  .map((entry, i) => ({
    index: 'snp',
    type: '23andme',
    id: i,
    body: entry
  }));

  // return rows.slice(0, 2000).map(row => {
  //   return {
  //     [row[0]]: row[3]
  //   };
  // })
  // .map((entry, i) => ({
  //   index: 'snp',
  //   type: '23andme',
  //   id: type + i,
  //   body: entry
  // }));
}

module.exports = {templatePromise, docsPromise};
