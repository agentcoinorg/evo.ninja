const axios = require('axios');
try {
  const response = await axios.get(url);
  return response.data;
} catch (error) {
  console.error(error);
}