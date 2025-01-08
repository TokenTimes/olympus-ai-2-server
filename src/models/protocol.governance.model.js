const mongoose = require('mongoose');

const governanceProtocolSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CryptoIdentity',
    required: true,
  },
  cname: { type: String, required: true },
  name: { type: String, required: true },
  categories: { type: [String], required: true },
  isEnabled: { type: Boolean, required: true },
  activeOnWebsite: { type: Boolean, required: true },
  totalProposals: { type: Number, required: true },
  totalVotes: { type: Number, required: true },
  uniqueVoters: { type: Number, required: true },

  tokens: [
    {
      adapter: { type: String, required: true },
      symbol: { type: String, required: true },
      network: { type: String, required: true },
      contractAddress: { type: String, required: true },
      _id: false,
    },
  ],
  type: { type: String, required: true },

  proposalCreationFunctionsSelectors: { type: [String], required: true },
  votingFunctionsSelectors: { type: [String], required: true },
  delegationFunctionsSelectors: { type: [String], required: true },
  proposalCreationContractAddress: { type: String, required: true },
  votingContractAddress: { type: String, required: true },
  delegationContractAddress: { type: String, required: true },
});
governanceProtocolSchema.index({ projectId: 1 });
const GovernanceProtocol = mongoose.model(
  'GovernanceProtocol',
  governanceProtocolSchema
);

module.exports = GovernanceProtocol;
