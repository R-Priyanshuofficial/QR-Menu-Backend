const mongoose = require('mongoose')

const PushSubscriptionSchema = new mongoose.Schema(
  {
    endpoint: { type: String, required: true, unique: true },
    keys: {
      p256dh: { type: String, required: true },
      auth: { type: String, required: true },
    },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    phone: { type: String }, // customer phone to target customer pushes
  },
  { timestamps: true }
)

module.exports = mongoose.model('PushSubscription', PushSubscriptionSchema)
