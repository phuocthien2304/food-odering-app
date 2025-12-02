// test-mongo.js
const mongoose = require('mongoose');

async function main() {
  const uri =
    'mongodb://127.0.0.1:27017/restaurant-service?directConnection=true&serverSelectionTimeoutMS=5000';

  try {
    console.log('Connecting to:', uri);
    await mongoose.connect(uri);
    console.log('✅ Connected OK!');

    const dbs = await mongoose.connection.db.admin().listDatabases();
    console.log('Databases:', dbs.databases.map((d) => d.name));

    await mongoose.disconnect();
  } catch (err) {
    console.error('❌ Mongo connect error:');
    console.error(err);
  }
}

main();
