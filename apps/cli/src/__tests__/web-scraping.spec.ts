import { TestCase, runTestCases } from "./TestCase";

import path from "path";

jest.setTimeout(600000);

describe('Web Scraping', () => {
  const scriptsDir = path.join(__dirname, "../../../../scripts");

  const cases: TestCase[] = [
    new TestCase(
      "scraping_text_basic",
      "Open 'https://silennaihin.com/random/plain.html' and paste all of the text on the page in a output.txt file",
      "This is a Heading\nThis is a paragraph.",
      scriptsDir
    ),
    new TestCase(
      "scraping_links_basic",
      "Open 'https://webscraper.io/test-sites/e-commerce/allinone' and paste all http links on the page in a output.txt file",
      "/,#page-top,/,/cloud-scraper,/pricing,#section3,/documentation,/tutorials,/how-to-videos,/test-sites,https://forum.webscraper.io/,https://chrome.google.com/webstore/detail/web-scraper/jnhgnonknehpejjnehehllkliplmbmhn?hl=en,https://cloud.webscraper.io/,/test-sites/e-commerce/allinone,/test-sites/e-commerce/allinone/phones,/test-sites/e-commerce/allinone/computers,/test-sites/e-commerce/allinone/product/495,/test-sites/e-commerce/allinone/product/524,/test-sites/e-commerce/allinone/product/600,/,/pricing,/about-us,/contact,/privacy-policy,/extension-privacy-policy,https://webscraper.io/downloads/Web_Scraper_Media_Kit.zip,/jobs,/blog,/documentation,/tutorials,/screenshots,/test-sites,https://forum.webscraper.io/,https://status.webscraper.io/,mailto:info@webscraper.io,https://www.facebook.com/webscraperio/,https://twitter.com/webscraperio,#",
      scriptsDir
    ),
    new TestCase(
      "getText",
      "Web scrape all the text from https://polywrap.io and save the result in a file named output.txt",
      "Polywrap is a framework for building  Wraps: Portable & Composable Modules Wraps let you run your code anywhere. Any app equipped with a Polywrap client can run any wrap, all within a secure WebAssembly VM. app.ts app.py app.rs Polywrap helps developers : reduce code duplication, eliminate rebuilds, and create extensible software. Write one SDK that can run within any language or platform. Wraps can be fetched at run-time, unlocking new use-cases. Sandboxing keeps users safe, isolating wraps from app secrets. Docs Wrapscan Github Discord Twitter Blog Handbook Forum Snapshot Build Social Governance Portable On-Demand Secure Built and Backed By the Best              Composable Future One Wrap Any App   app.py app.rs 2   value :   \"...\" , 2   value :   \"...\" , 3   object :   { 3   object :   { 4      ... 4      ... 5    } 5    } 6 } ) ; 6 } ) ; Build More Faster    WRAPS ARE BETTER SDKs          The Wrap Ecosystem                                                             Join the Composable Future       Social Discord Twitter Blog Social Discord Twitter Blog Social  Discord Twitter Blog Governance Handbook Forum Snapshot Governance Handbook Forum Snapshot Governance  Handbook Forum Snapshot Enter The 1 await  wrap . function ( { await wrap . function ( {  2 value :   \"...\" , value :  \"...\" ,  3 object :   { object :  {  4 ...  ...  5 }  }  6 } ) ;  } ) ;",
      scriptsDir
    ),
    new TestCase(
      "getLinks",
      "Web scrape all the links from https://polywrap.io and save the result in a file named output.txt",
      "/, https://docs.polywrap.io/, https://ens.domains/, https://ethereum.org, https://gelato.network/, https://ipfs.tech/, https://near.org, https://pokt.network, https://polkadot.network, https://gnosis-safe.io/, https://tezos.com, https://uniswap.org, https://coinfund.io/, https://placeholder.vc/, https://trueventures.com/, https://portal.vc/, https://zeeprime.capital/, https://atka.io/, https://trgc.io/, https://ascensiveassets.com/, https://rarestone.capital/, https://gnosis.com, https://iosg.vc/, https://blockwatch.cc/, https://chainsafe.io/, https://consideritdone.tech/, https://dorg.tech, https://docs.polywrap.io/, https://discord.com/invite/Z5m88a5qWu, /, https://docs.polywrap.io/, https://wrapscan.io/, https://github.com/polywrap, https://discord.com/invite/Z5m88a5qWu, https://twitter.com/polywrap_io, https://blog.polywrap.io/, https://handbook.polywrap.io/, https://forum.polywrap.io/, https://snapshot.org/#/polywrap.eth",
      scriptsDir
    ),
  ];

  runTestCases(cases);
});
