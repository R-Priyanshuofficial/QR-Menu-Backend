const mongoose = require('mongoose');

const brandThemeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  designConfig: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
}, {
  timestamps: true
});

brandThemeSchema.index({ userId: 1 });

module.exports = mongoose.model('BrandTheme', brandThemeSchema);
