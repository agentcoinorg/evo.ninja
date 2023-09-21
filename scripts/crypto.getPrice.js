const axios = require('axios');

const url = 'https://api.coingecko.com/api/v3/simple/price';
const params = {
  ids: currency,
  vs_currencies: 'usd'
};

try {
  const response = await axios.get(url, { params });
  return response.data[currency].usd;
} catch (error) {
  throw new Error(`Could not fetch price for ${currency}: ${error.message}`);
}