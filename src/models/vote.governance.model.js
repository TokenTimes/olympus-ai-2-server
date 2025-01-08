const mongoose = require('mongoose');

const proposalVoteSchema = new mongoose.Schema({
  governProposal: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GovernanceProposal',
    required: true,
  },
  refId: { type: String, required: true, unique: true },
  proposalRefId: { type: String, required: true },
  protocol: { type: String, required: true },
  adapter: { type: String, required: true },
  proposalId: { type: String, required: true },
  address: { type: String, required: true },
  power: { type: Number, required: true },
  reason: { type: String, default: '' },
  choice: { type: Number, required: true },
  timestamp: { type: String, required: true },
  choices: { type: mongoose.Schema.Types.Mixed, required: true },
  privacy: { type: String, default: '' },
  txHash: { type: String, default: '' },
  chainName: { type: String, default: '' },
});
proposalVoteSchema.index({ governProposal: 1 });
const ProposalVote = mongoose.model('ProposalVote', proposalVoteSchema);

module.exports = ProposalVote;
