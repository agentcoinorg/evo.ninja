import {
  AgentFunctionResult,
  AgentOutputType,
  AgentVariables,
  ChatMessageBuilder,
  Workspace
} from "@evo-ninja/agent-utils";
import { AgentFunctionBase } from "./utils";
import { FUNCTION_CALL_SUCCESS_CONTENT, FUNCTION_CALL_FAILED} from "../agents/Scripter/utils";
import path from "path";
import { Agent } from "../agents/utils";

interface InitPoetryFuncParameters {}

export class InitPoetryFunction extends AgentFunctionBase<InitPoetryFuncParameters> {

  name: string = "initPoetry";
  description: string = `Initialize a Python Poetry environment in the workspace.`;
  parameters: any = {"type": "object", "properties": {}};

  buildExecutor({ context }: Agent<unknown>): (params: InitPoetryFuncParameters, rawParams?: string) => Promise<AgentFunctionResult> {
    return async (params: InitPoetryFuncParameters, rawParams?: string): Promise<AgentFunctionResult> => {
      const result = await this.poetryInit(context.workspace);
      if (result.exitCode !== 0) {
        return this.onError(result.stderr, params, rawParams, context.variables);
      }
      return this.onSuccess(params, rawParams, context.variables);
    };
  }

  private onSuccess(params: InitPoetryFuncParameters, rawParams: string | undefined, variables: AgentVariables): AgentFunctionResult {
    return {
      outputs: [
        {
          type: AgentOutputType.Success,
          title: this.name,
          content: FUNCTION_CALL_SUCCESS_CONTENT(
            this.name,
            params,
            "Initialized Poetry Environment."
          )
        }
      ],
      messages: [
        ChatMessageBuilder.functionCall(this.name, rawParams),
        ChatMessageBuilder.functionCallResult(
          this.name,
          "Initialized Python Poetry Environment. You can now execute `poetry run [command] [args]` in the shell."
        ),
      ]
    }
  }

  private onError(error: string, params: InitPoetryFuncParameters, rawParams: string | undefined, variables: AgentVariables): AgentFunctionResult {
    return {
      outputs: [
        {
          type: AgentOutputType.Error,
          title: "Failed to initialize poetry environment",
          content: FUNCTION_CALL_FAILED(params, this.name, error ?? "Unknown error"),
        }
      ],
      messages: [
        ChatMessageBuilder.functionCall(this.name, rawParams),
        ChatMessageBuilder.functionCallResult(
          this.name,
          `Failed to init poetry: ${error}.`
        ),
      ]
    }
  }

  private async poetryInit(workspace: Workspace):  Promise<{exitCode: number, stdout: string, stderr: string}> {
    await workspace.exec("poetry", ["init", "-n"]);
    const dependencies = this.getPythonDependencies(workspace, "/");
    const alwaysAdd = ["pytest", "pydantic"];
    const toAdd = Array.from(new Set(dependencies.concat(alwaysAdd)));
    return await workspace.exec("poetry", ["add", ...toAdd]);
  }

  // does not search recursively
  private getPythonDependencies(workspace: Workspace, dir: string): string[] {
    const pythonFiles = workspace.readdirSync(dir)
      .map(dirEntry => dirEntry.name)
      .filter(file => file.endsWith(".py"));

    const imports = pythonFiles.flatMap(file => {
      const filePath = path.join(dir, file);
      const fileContent = workspace.readFileSync(filePath);
      return this.parsePythonImports(fileContent);
    });

    const uniqueImports = Array.from(new Set(imports));

    const externalImports = uniqueImports.filter(importName => {
      const maybeLocalPath = path.join(dir, `${importName}.py`);
      return !workspace.existsSync(maybeLocalPath) && !this.common_native_python_packages.has(importName);
    });

    return externalImports;
  }

  // does not handle relative imports or sub-module imports
  private parsePythonImports(fileContent: string): string[] {
    const imports: string[] = [];

    const singleImportRegex = /^(?:import|from) ([a-zA-Z0-9_]+)(?: import [a-zA-Z0-9_*]+(?: as [a-zA-Z0-9_]+)?)?/gm;
    const multipleImportRegex = /^import ([a-zA-Z0-9_ ,]+)$/gm;
    const multipleFromImportRegex = /^from ([a-zA-Z0-9_]+) import (?:[a-zA-Z0-9_ ,]+)$/gm;

    let match;
    while (match = singleImportRegex.exec(fileContent)) {
      imports.push(match[1]);
    }
    while (match = multipleImportRegex.exec(fileContent)) {
      imports.push(...match[1].split(', ').map(item => item.trim()));
    }
    while (match = multipleFromImportRegex.exec(fileContent)) {
      imports.push(match[1]);
    }

    return imports;
  }

  common_native_python_packages = new Set([
      "_ast",
      "_bisect",
      "_blake2",
      "_codecs",
      "_collections",
      "_datetime",
      "_elementtree",
      "_functools",
      "_heapq",
      "_imp",
      "_io",
      "_json",
      "_locale",
      "_md5",
      "_operator",
      "_pickle",
      "_posixsubprocess",
      "_random",
      "_sha1",
      "_sha256",
      "_sha3",
      "_sha512",
      "_signal",
      "_sre",
      "_stat",
      "_string",
      "_struct",
      "_symtable",
      "_thread",
      "_tracemalloc",
      "_warnings",
      "_weakref",
      "abc",
      "argparse",
      "array",
      "ast",
      "asynchat",
      "asyncio",
      "asyncore",
      "atexit",
      "audioop",
      "base64",
      "bdb",
      "binascii",
      "binhex",
      "bisect",
      "builtins",
      "bz2",
      "cProfile",
      "calendar",
      "cgi",
      "cgitb",
      "chunk",
      "cmath",
      "cmd",
      "code",
      "codecs",
      "codeop",
      "collections",
      "colorsys",
      "compileall",
      "concurrent",
      "configparser",
      "contextlib",
      "contextvars",
      "copy",
      "copyreg",
      "crypt",
      "csv",
      "ctypes",
      "curses",
      "dataclasses",
      "datetime",
      "dbm",
      "decimal",
      "difflib",
      "dis",
      "distutils",
      "doctest",
      "email",
      "encodings",
      "ensurepip",
      "enum",
      "errno",
      "faulthandler",
      "fcntl",
      "filecmp",
      "fileinput",
      "fnmatch",
      "formatter",
      "fractions",
      "ftplib",
      "functools",
      "gc",
      "getopt",
      "getpass",
      "gettext",
      "glob",
      "grp",
      "gzip",
      "hashlib",
      "heapq",
      "hmac",
      "html",
      "http",
      "imaplib",
      "imghdr",
      "imp",
      "importlib",
      "inspect",
      "io",
      "ipaddress",
      "itertools",
      "json",
      "keyword",
      "lib2to3",
      "linecache",
      "locale",
      "logging",
      "lzma",
      "mailbox",
      "mailcap",
      "marshal",
      "math",
      "mimetypes",
      "mmap",
      "modulefinder",
      "msilib",
      "msvcrt",
      "multiprocessing",
      "netrc",
      "nntplib",
      "nt",
      "ntpath",
      "opcode",
      "operator",
      "optparse",
      "os",
      "pathlib",
      "pdb",
      "pickle",
      "pipes",
      "pkgutil",
      "platform",
      "plistlib",
      "poplib",
      "posix",
      "posixpath",
      "pprint",
      "profile",
      "pstats",
      "pty",
      "pwd",
      "py_compile",
      "pyclbr",
      "pydoc",
      "queue",
      "quopri",
      "random",
      "re",
      "readline",
      "reprlib",
      "resource",
      "rlcompleter",
      "runpy",
      "sched",
      "secrets",
      "select",
      "selectors",
      "shelve",
      "shlex",
      "shutil",
      "signal",
      "site",
      "smtpd",
      "smtplib",
      "sndhdr",
      "socket",
      "socketserver",
      "spwd",
      "sqlite3",
      "sre_compile",
      "sre_constants",
      "sre_parse",
      "ssl",
      "stat",
      "statistics",
      "string",
      "stringprep",
      "struct",
      "subprocess",
      "sunau",
      "symbol",
      "symtable",
      "sys",
      "sysconfig",
      "tabnanny",
      "tarfile",
      "telnetlib",
      "tempfile",
      "termios",
      "textwrap",
      "this",
      "threading",
      "time",
      "timeit",
      "token",
      "tokenize",
      "trace",
      "traceback",
      "tracemalloc",
      "tty",
      "turtle",
      "types",
      "typing",
      "unicodedata",
      "unittest",
      "urllib",
      "uu",
      "uuid",
      "venv",
      "wave",
      "weakref",
      "webbrowser",
      "wsgiref",
      "xdrlib",
      "xml",
      "xmlrpc",
      "zipapp",
      "zipfile",
      "zipimport",
      "zoneinfo",
      "zlib"
    ]);
}