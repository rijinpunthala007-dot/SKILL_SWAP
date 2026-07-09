import mongoose from 'mongoose';
const userSchema = new mongoose.Schema({ name: String });
const msgSchema = new mongoose.Schema({ sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, content: String });
const User = mongoose.model('User', userSchema);
const Msg = mongoose.model('Msg', msgSchema);
async function test() {
  await mongoose.connect('mongodb://127.0.0.1:27017/skillswap-dev');
  const user = new User({ name: 'Alice' });
  await user.save();
  const msg = new Msg({ sender: user._id, content: 'Hello' });
  await msg.save();
  const fetched = await Msg.findById(msg._id).populate('sender', 'name');
  console.log('JSON.stringify(fetched):');
  console.log(JSON.stringify(fetched, null, 2));
  await mongoose.disconnect();
}
test().catch(console.error);
