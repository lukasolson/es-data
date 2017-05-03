const _ = require('lodash');
const Promise = require('bluebird');
const elasticsearch = require('elasticsearch');
const client = new elasticsearch.Client({
  host: 'localhost:9200',
  auth: 'elastic:changeme'
});

const datasets = [
  require('./energy'),
  require('./finance'),
  require('./health'),
  require('./snp'),
  require('./weather')
];

datasets.forEach(({indexPromise, docsPromise}) => {
  indexPromise.then(index => client.indices.create(index))
  .then(() => docsPromise)
  .then(docs => (
    _.chunk(docs, 10000)
    .map(chunk => client.bulk(getBulkFromDocs(chunk)))
  ))
  .catch(console.log);
});

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
