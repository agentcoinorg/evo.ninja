const axios = require('axios');

const response = await axios.get('https://duckduckgo.com/html/?q=' + query);

const html = response.data;

const startLinkIndex = html.indexOf('<a rel="nofollow" class="result__url"');

if (startLinkIndex === -1) {
  throw new Error('No results found');
}

const endLinkIndex = html.indexOf('</a>', startLinkIndex);

if (endLinkIndex === -1) {
  throw new Error('Failed to parse result');
}

const link = html.substring(startLinkIndex, endLinkIndex);

const startUrlIndex = link.indexOf('href="') + 6;

const endUrlIndex = link.indexOf('"', startUrlIndex);

if (startUrlIndex === -1 || endUrlIndex === -1) {
  throw new Error('Failed to parse result URL');
}

const url = link.substring(startUrlIndex, endUrlIndex);

return url;