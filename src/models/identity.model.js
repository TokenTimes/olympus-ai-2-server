const mongoose = require('mongoose');

const cryptoIdentitySchema = new mongoose.Schema(
  {
    coinMarketCapId: { type: Number, required: true, unique: true },
    defillamaId: { type: Number, default: null },
    rank: { type: Number, required: true },
    name: { type: String, required: true },
    symbol: { type: String, required: true },
    cmcSlug: { type: String, required: true },
    defillamaSlug: { type: String, default: null },
    isActive: { type: Boolean, required: true },
    firstHistoricalData: { type: Date, required: true },
    lastHistoricalData: { type: Date, required: true },
    platformName: { type: String, default: null },
    tokenAddress: { type: String },
    decimal: { type: Number, default: null },
    url: { type: String },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
    },
    toObject: {
      virtuals: true,
    },
  }
);

cryptoIdentitySchema.virtual('projectDetail', {
  ref: 'ProjectDetails',
  localField: '_id',
  foreignField: 'projectId',
});

const CryptoIdentity = mongoose.model('CryptoIdentity', cryptoIdentitySchema);
module.exports = CryptoIdentity;
