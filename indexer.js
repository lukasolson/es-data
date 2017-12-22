const {chunk, flatten} = require('lodash');
const elasticsearch = require('elasticsearch');
const client = new elasticsearch.Client({
  host: 'elastic:password@localhost:9200'
});

let whenReady = Promise.resolve();

function indexDocs(docs) {
  if (!docs.length) return;
  const chunks = chunk(docs, 1000);
  chunks.forEach(scheduleDocs);
}

function scheduleDocs(docs) {
  const bulk = getBulkFromDocs(docs);
  whenReady = whenReady.then(() => {
    console.log(`Indexing ${docs.length} docs...`);
    return client.bulk(bulk);
  });
}

function getBulkFromDocs(docs) {
  const actions = docs.map(doc => [
    getActionFromDoc(doc),
    doc.body,
  ]);
  const body = flatten(actions);
  return {body};
}

function getActionFromDoc(doc) {
  return {
    index: {
      _index: doc.index,
      _type: doc.type,
      _id: doc.id,
    }
  };
}

module.exports = {indexDocs};
