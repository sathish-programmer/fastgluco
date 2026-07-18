const mongoose = require('mongoose');
const Laboratory = require('./dist/models/Laboratory').default;

mongoose.connect('mongodb://127.0.0.1:27017/healthApp')
  .then(async () => {
    try {
      const labs = await Laboratory.find();
      console.log('Success:', labs);
    } catch(e) {
      console.error('Error finding labs:', e);
    }
    process.exit(0);
  });
