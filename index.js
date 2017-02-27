const Promise = require('bluebird');
const elasticsearch = require('elasticsearch');
const client = new elasticsearch.Client({
  host: 'localhost:9200',
  auth: 'elastic:changeme'
});

const datasets = [
  require('./energy'),
  require('./finance'),
  require('./health')
];

datasets.forEach(({indexPromise, docsPromise}) => {
  indexPromise.then(index => client.indices.create(index))
  .then(() => docsPromise)
  .then(docs => {
    return Promise.all(docs.map(doc => client.index(doc)))
  })
  .catch(console.log);
});
