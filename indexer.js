const _ = require('lodash');
const Promise = require('bluebird');
const elasticsearch = require('elasticsearch');
const client = new elasticsearch.Client({
  host: 'elastic:password@localhost:9200'
});

let queue = [];

function createTemplate(template) {
  return client.indices.putTemplate(template);
}

function indexDocs(docs) {
  if (docs.length === 0) return;
  const beginNow = queue.length === 0;
  queue = queue.concat(docs);
  if (beginNow) processQueue();
}

function processQueue(chunkSize = 1000) {
  console.log(queue.length);
  const chunk = queue.slice(0, chunkSize);
  queue = queue.slice(chunkSize);
  const bulkRequest = getBulkFromDocs(chunk);
  client.bulk(bulkRequest, (err, resp) => {
    if (err) throw err;
    if (queue.length > 0) processQueue();
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

module.exports = {createTemplate, indexDocs};
