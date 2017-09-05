const _ = require('lodash');
const Promise = require('bluebird');
const elasticsearch = require('elasticsearch');
const client = new elasticsearch.Client({
  host: 'elastic:password@localhost:9200'
});

const datasets = [
  // require('./energy'),
  require('./finance'),
  // require('./health'),
  // require('./snp'),
  // require('./weather')
];

Promise.each(datasets, ({templatePromise, docsPromise}) => {
  return templatePromise
  .then(template => client.indices.putTemplate(template))
  .then(() => docsPromise)
  .then(indexDocs)
  .catch(console.log);
});

function indexDocs(docs) {
  const chunks = _.chunk(docs, 1000);
  return Promise.each(chunks, chunk => {
    client.bulk(getBulkFromDocs(chunk));
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
