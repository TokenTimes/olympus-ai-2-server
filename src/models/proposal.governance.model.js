const mongoose = require('mongoose');

const governanceProposalSchema = new mongoose.Schema({
  protocolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GovernanceProtocol',
    required: true,
  },
  refId: { type: String, required: true, unique: true },
  id: { type: String, required: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  protocol: { type: String, required: true },
  adapter: { type: String, required: true },
  proposer: { type: String, required: true },
  totalVotes: { type: Number, default: 0 },
  blockNumber: { type: Number, required: true },
  externalUrl: { type: String, required: true },
  startTimestamp: { type: String, required: true },
  endTimestamp: { type: String, required: true },
  currentState: { type: String, required: true },
  choices: [{ type: String }],
  results: [{ type: Object }],
  events: [
    {
      time: {
        blockNumber: { type: Number },
      },
      event: { type: String },
      timestamp: { type: Number },
      txHash: { type: String },
    },
  ],
  type: { type: String },
  indexedResult: [{ type: Object }],
  summary: { type: String },
  privacy: { type: String },
  indexedAt: { type: Number },
  executables: { type: Object },
  txHash: { type: String },
  quorum: { type: Number },
  flagged: { type: Boolean },
  executionArgs: { type: Object },
  chainId: { type: Number },
  discussion: { type: String },
});
governanceProposalSchema.index({ protocolId: 1 });
const GovernanceProposal = mongoose.model(
  'GovernanceProposal',
  governanceProposalSchema
);

module.exports = GovernanceProposal;
