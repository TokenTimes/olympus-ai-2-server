const axios = require('axios');
const CryptoIdentity = require('../models/identity.model');
const GovernanceProtocol = require('../models/protocol.governance.model');
const GovernanceProposal = require('../models/proposal.governance.model');
const ProposalVote = require('../models/vote.governance.model');
const { getApiKey } = require('../utils/apiKey.helper');
const logger = require('log4js').getLogger('boardroom.schedular.js');

const getAllGovernanceProtocol = async () => {
  const BOARDROOM_API_KEY = await getApiKey({ platform: 'Boardroom' });
  try {
    const response = await axios.get(
      'https://api.boardroom.info/v1/protocols',
      {
        params: {
          key: BOARDROOM_API_KEY,
          excludeTokenInfo: false,
          includeContractMetadata: true,
        },
      }
    );

    const bulkOps = [];

    for (const protocol of response.data.data) {
      if (
        !protocol?.tokens ||
        protocol.tokens.length === 0 ||
        !protocol.tokens[0].contractAddress
      ) {
        continue;
      }

      const cryptoIdentity = await CryptoIdentity.findOne({
        tokenAddress: protocol.tokens[0].contractAddress.toLowerCase(),
      });

      if (
        cryptoIdentity &&
        cryptoIdentity.symbol.toLowerCase() ===
          protocol?.tokens?.[0].symbol.toLowerCase()
      ) {
        const governanceProtocolData = {
          projectId: cryptoIdentity._id,
          cname: protocol.cname,
          name: protocol.name,
          categories: protocol.categories,
          isEnabled: protocol.isEnabled,
          activeOnWebsite: protocol.activeOnWebsite,
          totalProposals: protocol.totalProposals,
          totalVotes: protocol.totalVotes,
          uniqueVoters: protocol.uniqueVoters,
          tokens: protocol.tokens.map((token) => ({
            adapter: token.adapter,
            symbol: token.symbol,
            network: token.network,
            contractAddress: token.contractAddress.toLowerCase(),
          })),
          type: protocol.type,
          proposalCreationFunctionsSelectors:
            protocol.proposalCreationFunctionsSelectors || [],
          votingFunctionsSelectors: protocol.votingFunctionsSelectors || [],
          delegationFunctionsSelectors:
            protocol.delegationFunctionsSelectors || [],
          proposalCreationContractAddress:
            protocol.proposalCreationContractAddress || null,
          votingContractAddress: protocol.votingContractAddress || null,
          delegationContractAddress: protocol.delegationContractAddress || null,
        };

        bulkOps.push({
          updateOne: {
            filter: { projectId: cryptoIdentity._id, cname: protocol.cname },
            update: { $set: governanceProtocolData },
            upsert: true,
          },
        });

        logger.info(
          `Added protocol for ${protocol.name} with projectId ${cryptoIdentity._id}`
        );
      }
    }

    if (bulkOps.length > 0) {
      const result = await GovernanceProtocol.bulkWrite(bulkOps);
      logger.info('Bulk operation completed successfully');
    }
  } catch (error) {
    logger.error('Error fetching protocols:', error.message);
  }
};

const getAllProposalsForProtocol = async () => {
  try {
    const BOARDROOM_API_KEY = await getApiKey({ platform: 'Boardroom' });
    const governanceProtocols = await GovernanceProtocol.find({});
    for (const protocol of governanceProtocols) {
      const [pendingOrActiveProposals, allProposals] = await Promise.all([
        GovernanceProposal.find({
          protocolId: protocol._id,
          $or: [{ currentState: 'pending' }, { currentState: 'active' }],
        }),
        GovernanceProposal.find({
          protocolId: protocol._id,
        }),
      ]);

      const totalProposalsCount = allProposals.length;
      if (protocol.totalProposals === totalProposalsCount) {
        continue;
      }

      let isPaginationCursorNeeded = false;
      let indexedAtThreshold = 0;
      let responseLimit = 1000;

      if (pendingOrActiveProposals.length === 0 && totalProposalsCount === 0) {
        isPaginationCursorNeeded = true;
        logger.info(
          `Adding proposals data for the first time for protocol: ${protocol.cname}`
        );
      } else if (
        pendingOrActiveProposals.length === 0 &&
        totalProposalsCount !== 0
      ) {
        indexedAtThreshold = Math.max(
          ...allProposals.map((proposal) => proposal.indexedAt)
        );
        responseLimit = 100;
        logger.info(
          `Fetching new proposal data starting from indexedAt ${indexedAtThreshold} for protocol: ${protocol.cname}`
        );
      } else {
        indexedAtThreshold = Math.min(
          ...pendingOrActiveProposals.map((proposal) => proposal.indexedAt)
        );
        responseLimit = pendingOrActiveProposals.length;
        logger.info(
          `Updating and adding proposal data starting from indexedAt ${indexedAtThreshold} for protocol: ${protocol.cname}`
        );
      }

      let paginationCursor = null;
      let hasMoreProposals = true;
      const bulkUpdateOperations = [];

      while (hasMoreProposals) {
        let apiResponse;
        try {
          apiResponse = await axios.get(
            `https://api.boardroom.info/v1/protocols/${protocol.cname}/proposals`,
            {
              params: {
                key: BOARDROOM_API_KEY,
                orderByIndexedAt: 'desc',
                cursor: paginationCursor,
                limit: `${responseLimit}`,
              },
            }
          );
        } catch (error) {
          if (error.code === 'ERR_BAD_RESPONSE') {
            break;
          }
        }

        for (const proposal of apiResponse.data.data) {
          if (!proposal?.indexedAt) {
            continue;
          }

          const proposalDetails = {
            protocolId: protocol._id,
            refId: proposal.refId,
            id: proposal.id,
            title: proposal.title,
            content: proposal.content,
            protocol: proposal.protocol,
            adapter: proposal.adapter,
            proposer: proposal.proposer,
            totalVotes: proposal.totalVotes || 0,
            blockNumber: proposal.blockNumber,
            externalUrl: proposal.externalUrl,
            startTimestamp: proposal.startTimestamp,
            endTimestamp: proposal.endTimestamp,
            currentState: proposal.currentState,
            choices: proposal.choices || [],
            results: proposal.results || [],
            events: proposal.events || [],
            type: proposal.type,
            indexedResult: proposal.indexedResult || [],
            summary: proposal.summary,
            privacy: proposal.privacy,
            indexedAt: proposal.indexedAt,
            executables: proposal.executables,
            txHash: proposal.txHash,
            quorum: proposal.quorum,
            flagged: proposal.flagged || false,
            executionArgs: proposal.executionArgs,
            chainId: proposal.chainId,
            discussion: proposal.discussion,
          };

          bulkUpdateOperations.push({
            updateOne: {
              filter: { protocolId: protocol._id, refId: proposal.refId },
              update: { $set: proposalDetails },
              upsert: true,
            },
          });
        }

        if (isPaginationCursorNeeded) {
          paginationCursor = apiResponse.data.nextCursor;
          logger.info(
            `Fetching more proposal data for protocol: ${protocol.cname} using cursor ${paginationCursor}`
          );
        } else {
          const minIndexedAtInResponse = Math.min(
            ...apiResponse.data.data.map((p) => p.indexedAt)
          );
          if (minIndexedAtInResponse > indexedAtThreshold) {
            paginationCursor = apiResponse.data.nextCursor;
            logger.info(
              `Adding new or updating old proposal data for protocol: ${protocol.cname}`
            );
          } else {
            paginationCursor = null;
          }
        }

        if (!paginationCursor) {
          hasMoreProposals = false;
        }
      }

      if (bulkUpdateOperations.length > 0) {
        await GovernanceProposal.bulkWrite(bulkUpdateOperations);
        logger.info(
          `Bulk update completed for protocol: ${protocol.cname} with ${bulkUpdateOperations.length} proposals`
        );
      }
    }
  } catch (error) {
    logger.error('Error fetching proposals:', error.message);
  }
};

const getAllVotesForProposal = async () => {
  const BOARDROOM_API_KEY = await getApiKey({ platform: 'Boardroom' });
  const governanceProtocols = await GovernanceProtocol.find({});
  let totalProtocols = governanceProtocols.length;

  for (const protocol of governanceProtocols) {
    logger.info(`Started processing protocol: ${protocol.cname}`);

    const governanceProposal = await GovernanceProposal.find({
      protocolId: protocol._id,
    });

    let totalProposalsThere = governanceProposal.length;
    logger.info(
      `Found ${totalProposalsThere} proposals for protocol: ${protocol.cname}`
    );

    for (const proposal of governanceProposal) {
      logger.info(`Processing proposal ${proposal.blockNumber}`);

      if (proposal.totalVotes == 0) {
        logger.info(
          `No votes available for proposal ${proposal.blockNumber}. Skipping.`
        );
        totalProposalsThere -= 1;
        continue;
      }

      const savedVotes = await ProposalVote.countDocuments({
        governProposal: proposal._id,
      });

      const totalVotes = proposal.totalVotes;
      let newVotes = totalVotes - savedVotes;

      if (newVotes <= 0) {
        logger.info(
          `No new votes for proposal ${proposal.blockNumber}. Skipping.`
        );
        totalProposalsThere -= 1;
        continue;
      }

      logger.info(
        `Found ${newVotes} new votes to fetch for proposal ${proposal.blockNumber}`
      );

      let paginationCursor = null;
      while (newVotes > 0) {
        let bulkOps = [];
        let apiResponse;
        try {
          apiResponse = await axios.get(
            `https://api.boardroom.info/v1/proposals/${proposal.refId}/votes`,
            {
              params: {
                key: BOARDROOM_API_KEY,
                cursor: paginationCursor,
                limit: '1000',
              },
            }
          );
        } catch (error) {
          logger.error(
            `Error fetching votes for proposal ${proposal.blockNumber}: ${error.message}`
          );
          if (error.code === 'ERR_BAD_RESPONSE') {
            break;
          }
        }

        if (apiResponse?.data?.data?.length === 0) {
          logger.info(
            `No more votes found for proposal ${proposal.blockNumber}. Breaking out.`
          );
          break;
        }

        logger.info(
          `Fetched ${apiResponse.data.data.length} votes for proposal ${proposal.blockNumber}`
        );

        for (const vote of apiResponse.data.data) {
          const voteDetails = {
            governProposal: proposal._id,
            refId: vote.refId,
            proposalRefId: vote.proposalRefId,
            protocol: vote.protocol,
            adapter: vote.adapter,
            proposalId: vote.proposalId,
            address: vote.address,
            power: vote.power,
            reason: vote.reason || '',
            choice: vote.choice,
            timestamp: vote.timestamp || vote.time.timestamp,
            choices: vote.choices,
            privacy: vote.privacy || '',
            txHash: vote.txHash || '',
            chainName: vote.chainName || '',
          };

          bulkOps.push({
            updateOne: {
              filter: { governProposal: proposal._id, refId: vote.refId },
              update: { $set: voteDetails },
              upsert: true,
            },
          });
        }

        if (bulkOps.length > 0) {
          await ProposalVote.bulkWrite(bulkOps);
          logger.info(
            `Bulk update completed for proposal ${proposal.blockNumber}, added ${bulkOps.length} votes.`
          );
        }

        newVotes -= apiResponse.data.data.length;
        logger.info(
          `Remaining new votes for proposal ${proposal.blockNumber}: ${newVotes}`
        );
        paginationCursor = newVotes > 0 ? apiResponse.data.nextCursor : null;
      }

      totalProposalsThere -= 1;
      logger.info(
        `Remaining proposals for protocol ${protocol.cname}: ${totalProposalsThere}`
      );
    }

    totalProtocols -= 1;
    logger.info(`Remaining protocols to process: ${totalProtocols}`);
  }

  logger.info('Fetch process completed for all protocols.');
};

module.exports = {
  getAllGovernanceProtocol,
  getAllProposalsForProtocol,
  getAllVotesForProposal,
};
