const axios = require('axios');
const CryptoIdentity = require('../models/identity.model');
const ProjectStat = require('../models/project.stats.model');
const { getApiKey } = require('../utils/apiKey.helper');
const logger = require('log4js').getLogger('etherscan.scheduler.js');

const getTokenInfo = async (contractAddress, ETHERSCAN_API_KEY) => {
  const url = `https://api.etherscan.io/api?module=token&action=tokeninfo&contractaddress=${contractAddress}&apikey=${ETHERSCAN_API_KEY}`;
  try {
    const response = await axios.get(url);
    if (response.data.status === '1') {
      return response.data.result[0];
    }
    throw new Error(
      `Failed to fetch token info. Status: ${response.data.status}`
    );
  } catch (error) {
    logger.error(
      `Error fetching token info for address ${contractAddress}: ${error.message}`
    );
    return null;
  }
};

const getTokenHolderCount = async (contractAddress, ETHERSCAN_API_KEY) => {
  const url = `https://api.etherscan.io/api?module=token&action=tokenholdercount&contractaddress=${contractAddress}&apikey=${ETHERSCAN_API_KEY}`;
  try {
    const response = await axios.get(url);
    if (response.data.status === '1') {
      console.log(response.data);
      console.log('value', parseInt(response.data.result, 10));
      return parseInt(response.data.result, 10);
    }
    throw new Error(
      `Failed to fetch holder count. Status: ${response.data.status}`
    );
  } catch (error) {
    logger.error(
      `Error fetching token holder count for address ${contractAddress}: ${error.message}`
    );
    return null;
  }
};

const getTokenHolderList = async () => {
  const ETHERSCAN_API_KEY = await getApiKey({ platform: 'Etherscan' });
  const tokens = await CryptoIdentity.find({
    platformName: 'Ethereum',
    tokenAddress: { $ne: null },
  });
  console.log(tokens.length);
  let a = tokens.length;
  for (const token of tokens) {
    logger.info(`Processing token: ${token.name}`);

    const tokenHolderCount = await getTokenHolderCount(
      token.tokenAddress,
      ETHERSCAN_API_KEY
    );
    if (tokenHolderCount == null) {
      logger.warn(
        `Skipping token ${token.name} due to missing holder count information`
      );
      continue;
    }

    if (!token.decimal) {
      logger.info(`Fetching decimal information for token: ${token.name}`);
      const tokenInfo = await getTokenInfo(
        token.tokenAddress,
        ETHERSCAN_API_KEY
      );

      if (!tokenInfo) {
        logger.warn(`Skipping token ${token.name} due to missing token info.`);
        continue;
      }

      token.decimal = tokenInfo.divisor;
      await token.save();
    }

    logger.info(
      `Token ${token.name} has ${tokenHolderCount} holders and ${token.decimal} decimals`
    );

    let page = 1;
    let offset = 10000;
    let tokenHolderlist = [];
    let isMoreData = true;
    let count = tokenHolderCount;

    while (isMoreData) {
      try {
        const url = `https://api.etherscan.io/api?module=token&action=tokenholderlist&contractaddress=${token.tokenAddress}&page=${page}&offset=${offset}&apikey=${ETHERSCAN_API_KEY}`;
        const response = await axios.get(url);
        if (response?.data?.status !== '1') {
          throw new Error(
            `Failed to fetch holder list for ${token.name}. Status: ${response.data.status}`
          );
        }
        if (response?.data?.result?.length > 0) {
          count -= response.data.result.length;
          tokenHolderlist.push(...response.data.result);
          page++;
          logger.info(`Total holders remaining ${count}`);
          if (response.data.result.length < offset) {
            isMoreData = false;
          }
        } else {
          isMoreData = false;
        }
      } catch (error) {
        logger.error(
          `Error fetching data for token ${token.name}: ${error.message}`
        );
        isMoreData = false;
      }
    }

    tokenHolderlist.sort(
      (a, b) => Number(b.TokenHolderQuantity) - Number(a.TokenHolderQuantity)
    );

    const topHolders = tokenHolderlist.slice(0, 20).map((holder) => ({
      ...holder,
      TokenHolderQuantity:
        Number(holder.TokenHolderQuantity) /
        Math.pow(10, Number(token.decimal) || 0),
    }));

    await ProjectStat.findOneAndUpdate(
      { projectId: token._id },
      {
        $set: {
          tokenAddress: token.tokenAddress,
          totalHolders: tokenHolderCount,
          topHolders,
          name: token.name,
        },
      },
      { new: true, upsert: true }
    );
    a--;
    logger.info(`Stored top holders for ${token.name} successfully`);
  }
  console.log('processed', a);
};

module.exports = { getTokenHolderList, getTokenHolderCount };
