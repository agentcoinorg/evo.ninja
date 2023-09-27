import { TestCase, TestResult } from "./TestCase";
import { spawn } from 'child_process';
import copyfiles from "copyfiles";
import fs from "fs";
import path from "path";

jest.setTimeout(600000);

const copyFiles = async (src: string, dest: string) => {
  const absSrc = path.resolve(src);
  const absDest = path.resolve(dest);

  if (!fs.existsSync(absDest)) {
    fs.mkdirSync(absDest, { recursive: true });
  }
  await new Promise<void>((resolve, reject) => {
    copyfiles([`${absSrc}/*`, absDest], { up: true }, async (error) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
}

describe('AI Agent Test Suite - Web Scraping', () => {
  let testResults: TestResult[] = [];

  const cases: TestCase[] = [

    // Web Scraping
    new TestCase("getText", "Web scrape all the text from https://polywrap.io and save the result in a file named output.txt", "Polywrap is a framework for building  Wraps: Portable & Composable Modules Wraps let you run your code anywhere. Any app equipped with a Polywrap client can run any wrap, all within a secure WebAssembly VM. app.ts app.py app.rs Polywrap helps developers : reduce code duplication, eliminate rebuilds, and create extensible software. Write one SDK that can run within any language or platform. Wraps can be fetched at run-time, unlocking new use-cases. Sandboxing keeps users safe, isolating wraps from app secrets. Docs Wrapscan Github Discord Twitter Blog Handbook Forum Snapshot Build Social Governance Portable On-Demand Secure Built and Backed By the Best              Composable Future One Wrap Any App   app.py app.rs 2   value :   \"...\" , 2   value :   \"...\" , 3   object :   { 3   object :   { 4      ... 4      ... 5    } 5    } 6 } ) ; 6 } ) ; Build More Faster    WRAPS ARE BETTER SDKs          The Wrap Ecosystem                                                             Join the Composable Future       Social Discord Twitter Blog Social Discord Twitter Blog Social  Discord Twitter Blog Governance Handbook Forum Snapshot Governance Handbook Forum Snapshot Governance  Handbook Forum Snapshot Enter The 1 await  wrap . function ( { await wrap . function ( {  2 value :   \"...\" , value :  \"...\" ,  3 object :   { object :  {  4 ...  ...  5 }  }  6 } ) ;  } ) ;"),
    new TestCase("getLinks", "Web scrape all the links from https://polywrap.io and save the result in a file named output.txt", "/, https://docs.polywrap.io/, https://ens.domains/, https://ethereum.org, https://gelato.network/, https://ipfs.tech/, https://near.org, https://pokt.network, https://polkadot.network, https://gnosis-safe.io/, https://tezos.com, https://uniswap.org, https://coinfund.io/, https://placeholder.vc/, https://trueventures.com/, https://portal.vc/, https://zeeprime.capital/, https://atka.io/, https://trgc.io/, https://ascensiveassets.com/, https://rarestone.capital/, https://gnosis.com, https://iosg.vc/, https://blockwatch.cc/, https://chainsafe.io/, https://consideritdone.tech/, https://dorg.tech, https://docs.polywrap.io/, https://discord.com/invite/Z5m88a5qWu, /, https://docs.polywrap.io/, https://wrapscan.io/, https://github.com/polywrap, https://discord.com/invite/Z5m88a5qWu, https://twitter.com/polywrap_io, https://blog.polywrap.io/, https://handbook.polywrap.io/, https://forum.polywrap.io/, https://snapshot.org/#/polywrap.eth"),
  ];

  afterAll(() => {
    console.log('All test results:');
    testResults.forEach(result => {
      console.log(`Operation: ${result.goal}, Success: ${result.success}, Result: ${result.expected}, Expected: ${result.expected}`);
    });
  });

  cases.forEach((testCase) => {
    test(`Execute operation: ${testCase.goal}`, async () => {
      // Reset the testcase directory
      testCase.reset();

      let result: TestResult | undefined;

      await new Promise<void>(async (resolve, reject) => {
        const rootScriptsDir = `${__dirname}/../../../../scripts`;
        const testRootScriptsDir = `${testCase.rootDir}/scripts`;
        await copyFiles(rootScriptsDir, testRootScriptsDir);

        const child = spawn(
          'yarn', [
            'start',
            `'${testCase.goal}'`,
            `--root ${testCase.rootDir}`,
            "--timeout 480",
            "--debug"
          ],
          { shell: true }
        );

        child.stdout.on('data', (data) => {
          console.log(data.toString());
        });

        child.on('exit', () => {
          result = testCase.getResult();
          resolve();
        });

        child.on('error', (error) => {
          reject(error);
        });
      });

      if (!result) {
        throw Error("This shouldn't happen.");
      }

      testResults.push(result);
      expect(result.received).toBe(result.expected);
    });
  });
});