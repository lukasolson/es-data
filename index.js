const _ = require('lodash');
const Promise = require('bluebird');
const elasticsearch = require('elasticsearch');
const client = new elasticsearch.Client({
  host: 'elastic:password@localhost:9200'
});

const datasets = [
  require('./finance'),
  require('./health'),
  require('./productivity')
];

Promise.each(datasets, ({templatePromise, docsPromise}) => {
  return templatePromise
  .then(template => client.indices.putTemplate(template))
  .then(() => docsPromise)
  .then(indexDocs);
});

function indexDocs(docs, chunkSize = 1000) {
  if (!docs.length) return;
  console.log(docs.length);
  const chunk = docs.slice(0, chunkSize);
  const bulkRequest = getBulkFromDocs(chunk);
  client.bulk(bulkRequest, (err, resp) => {
    if (err) throw err;
    indexDocs(docs.slice(chunkSize));
  });
}

function getBulkFromDocs(docs) {
  return {
    body: _.flatten(
      docs.map(doc => [
        getActionFromDoc(doc),
        getBodyFromDoc(doc)
      ])
    )
  };
}

function getActionFromDoc(doc) {
  return {
    index: (
      _(doc)
      .omit('body')
      .mapKeys((value, key) => '_' + key)
      .value()
    )
  };
}

function getBodyFromDoc(doc) {
  return doc.body;
}
