import { NodeHtmlMarkdown } from 'node-html-markdown'
import { load } from "cheerio";
import axios from "axios";

const FETCH_WEBPAGE_TIMEOUT = 4000;
const TRUSTED_SOURCES = [
  "wikipedia",
  "statista",
  "macrotrends"
];

export const fetchHTML = (url: string) => {
  return axios.get(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (X11; Linux x86_64; rv:107.0) Gecko/20100101 Firefox/107.0",
    },
    timeout: FETCH_WEBPAGE_TIMEOUT,
  });
}

export const processWebpage = async (url: string) => {
  const response = await fetchHTML(url);
  const $ = load(response.data);

  $('script').remove();
  $('style').remove();
  $('noscript').remove();
  $('link').remove();
  $('head').remove();
  $('image').remove();
  $('img').remove();

  const html = $.html()

  const markdownText =
    NodeHtmlMarkdown.translate(html)
    .split("\n")
    .map(x => x.trim())
    .join("\n")
    .replaceAll("\n", "  ")

  return markdownText
}

export const searchOnGoogle = async(query: string, apiKey: string, maxResults = 10) => {
  const axiosClient = axios.create({
    baseURL: "https://serpapi.com",
  });

  const searchQuery = encodeURI(query);
  const urlParams = new URLSearchParams({
    engine: "google",
    q: searchQuery,
    location_requested: "United States",
    location_used: "United States",
    google_domain: "google.com",
    hl: "en",
    gl: "us",
    device: "desktop",
    api_key: apiKey,
  });

  const { data } = await axiosClient.get<{
    organic_results: {
      title: string;
      link: string;
      snippet: string;
      snippet_highlighted_words: string[];
    }[];
  }>(`/search?${urlParams.toString()}`, {
    headers: {
      Accept: "application/json",
    },
  });

  const result = data.organic_results
    .map((result) => ({
      title: result.title ?? "",
      url: result.link ?? "",
      description: result.snippet ?? "",
      trustedSource: TRUSTED_SOURCES.some(x => result.link.includes(x))
    }));

  return result.slice(0, maxResults);
}
