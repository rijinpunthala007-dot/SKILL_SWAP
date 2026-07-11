import mongoose from 'mongoose';
import { env } from './src/config/env';

async function run() {
  await mongoose.connect(env.MONGO_URI);
  const Message = mongoose.model('MessageTest', new mongoose.Schema({
    content: { type: String, maxlength: 5000, trim: true, default: '' },
    attachment: Object,
  }));
  try {
    const msg = await Message.create({ content: '', attachment: { url: 'abc' } });
    console.log('Success:', msg);
  } catch (err) {
    console.error('Error:', err);
  }
  process.exit(0);
}
run();
