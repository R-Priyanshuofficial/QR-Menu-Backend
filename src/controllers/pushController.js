const webPush = require('web-push')
const PushSubscription = require('../models/PushSubscription')

// Configure web-push from env
const {
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY,
  VAPID_SUBJECT = 'mailto:admin@example.com',
} = process.env

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webPush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)
}

exports.getPublicKey = async (req, res) => {
  res.json({ success: true, data: { publicKey: VAPID_PUBLIC_KEY || '' } })
}

exports.subscribe = async (req, res, next) => {
  try {
    const { endpoint, keys, userId, phone } = req.body || {}
    const subscription = { endpoint, keys, userId, phone }
    if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
      return res.status(400).json({ success: false, message: 'Invalid subscription' })
    }

    const doc = await PushSubscription.findOneAndUpdate(
      { endpoint: subscription.endpoint },
      subscription,
      { upsert: true, new: true }
    )

    res.status(201).json({ success: true, data: { id: doc._id } })
  } catch (err) {
    next(err)
  }
}

exports.test = async (req, res, next) => {
  try {
    const sub = await PushSubscription.findOne().sort({ createdAt: -1 })
    if (!sub) return res.status(404).json({ success: false, message: 'No subscription saved' })

    const payload = JSON.stringify({
      title: 'QR Menu Test',
      body: req.body?.message || 'This is a test push notification',
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      data: { url: '/' },
    })

    await webPush.sendNotification(sub, payload)
    res.json({ success: true, message: 'Push sent' })
  } catch (err) {
    // web-push throws with status codes, handle gracefully
    console.error('web-push error:', err.statusCode, err.body || err.message)
    next(err)
  }
}

// Helpers to send push notifications from other controllers
const sendToSubscriptions = async (subs, payload) => {
  const json = JSON.stringify(payload)
  const tasks = subs.map((s) => webPush.sendNotification(s, json).catch((e) => {
    // Clean up gone subscriptions
    if (e.statusCode === 410 || e.statusCode === 404) {
      return PushSubscription.deleteOne({ _id: s._id }).catch(() => {})
    }
  }))
  await Promise.allSettled(tasks)
}

exports.sendPushToUser = async (userId, payload) => {
  if (!userId) return
  const subs = await PushSubscription.find({ userId })
  if (subs.length) await sendToSubscriptions(subs, payload)
}

exports.sendPushToPhone = async (phone, payload) => {
  if (!phone) return
  const subs = await PushSubscription.find({ phone })
  if (subs.length) await sendToSubscriptions(subs, payload)
}
