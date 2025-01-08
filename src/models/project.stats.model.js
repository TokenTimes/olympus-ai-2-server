const mongoose = require('mongoose');

const ProjectStatSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CryptoIdentity',
    required: true,
    unique: true,
  },
  tokenAddress: { type: String, required: true },
  totalHolders: { type: Number, required: true },
  name: { type: String, required: true },
  topHolders: [
    {
      TokenHolderAddress: { type: String, required: true },
      TokenHolderQuantity: { type: Number, required: true },
      _id: false,
    },
  ],
});
const ProjectStat = mongoose.model('ProjectStat', ProjectStatSchema);
module.exports = ProjectStat;
