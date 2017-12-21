const elasticsearch = require('elasticsearch');
const client = new elasticsearch.Client({
  host: 'elastic:password@localhost:9200'
});

function createTemplate(template) {
  return client.indices.putTemplate(template);
}

function indexDocs(docs, chunkSize = 1000) {
  console.log(docs.length);
  if (docs.length <= 0) return;
  const chunk = docs.slice(0, chunkSize);
  const bulk = getBulkFromDocs(chunk);
  client.bulk(bulk, (err, resp) => {
    if (err) throw err;
     indexDocs(docs.slice(chunkSize), chunkSize);
  });
}

function getBulkFromDocs(docs) {
  const body = docs.reduce((bulk, doc) => {
    return [
      ...bulk,
      getActionFromDoc(doc),
      doc.body,
    ];
  }, []);
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

module.exports = {createTemplate, indexDocs};
