import type {
  ContinueRcJson,
  DocumentSymbol,
  FileStatsMap,
  FileType,
  IdeInfo,
  Location,
  Problem,
  Range,
  RangeInFile,
  SignatureHelp,
  TerminalOptions,
  Thread
} from "../";
import { ControlPlaneSessionInfo } from "../control-plane/AuthTypes";

export interface GetGhTokenArgs {
  force?: boolean;
}

export type ToIdeFromWebviewOrCoreProtocol = {
  // Methods from IDE type
  getIdeInfo: [undefined, IdeInfo];
  getWorkspaceDirs: [undefined, string[]];
  writeFile: [{ path: string; contents: string }, void];
  showVirtualFile: [{ name: string; content: string }, void];
  openFile: [{ path: string }, void];
  openUrl: [string, void];
  runCommand: [{ command: string; options?: TerminalOptions }, void];
  getSearchResults: [{ query: string; maxResults?: number }, string];
  getFileResults: [{ pattern: string; maxResults?: number }, string[]];
  subprocess: [{ command: string; cwd?: string }, [string, string]];
  saveFile: [{ filepath: string }, void];
  fileExists: [{ filepath: string }, boolean];
  readFile: [{ filepath: string }, string];
  getProblems: [{ filepath: string }, Problem[]];
  getOpenFiles: [undefined, string[]];
  getCurrentFile: [
    undefined,
    (
      | undefined
      | {
          isUntitled: boolean;
          path: string;
          contents: string;
        }
    ),
  ];
  getPinnedFiles: [undefined, string[]];
  showLines: [
    { filepath: string; startLine: number; endLine: number },
    void,
  ];
  showDiff: [{ filepath: string; newContents: string; stepIndex: number }, void];
  readRangeInFile: [{ filepath: string; range: Range }, string];
  showToast: [any[], void];
  getTerminalContents: [{ commands: number }, string];
  getWorkspaceConfigs: [undefined, ContinueRcJson[]];
  getDiff: [{ includeUnstaged: boolean }, string[]];
  getClipboardContent: [undefined, { text: string; copiedAt: string }];
  isTelemetryEnabled: [undefined, boolean];
  isWorkspaceRemote: [undefined, boolean];
  getUniqueId: [undefined, string];
  getTags: [string, any[]];
  getGitHubAuthToken: [GetGhTokenArgs, string];
  getBranch: [{ dir: string }, string];
  getRepoName: [{ dir: string }, string | undefined];
  getGitRootPath: [{ dir: string }, string | undefined];
  listDir: [{ dir: string }, [string, FileType][]];
  getFileStats: [{ files: string[] }, FileStatsMap];

  // Secret Storage
  readSecrets: [{ keys: string[] }, Record<string, string>];
  writeSecrets: [{ secrets: { [key: string]: string } }, void];

  // Debug-related methods
  getDebugLocals: [{ threadIndex: number }, string];
  getAvailableThreads: [undefined, Thread[]];
  getTopLevelCallStackSources: [{ threadIndex: number; stackDepth: number }, string[]];
  
  // IDE settings
  getIdeSettings: [undefined, any];

  gotoDefinition: [{ location: Location }, RangeInFile[]];
  gotoTypeDefinition: [{ location: Location }, RangeInFile[]];
  getSignatureHelp: [{ location: Location }, SignatureHelp | null];
  getReferences: [{ location: Location }, RangeInFile[]];
  getDocumentSymbols: [{ textDocumentIdentifier: string }, DocumentSymbol[]];

  getControlPlaneSessionInfo: [
    { silent: boolean; useOnboarding: boolean },
    ControlPlaneSessionInfo | undefined,
  ];
  logoutOfControlPlane: [undefined, void];
  
  // ArchiTech Auth protocols
  "auth/login": [
    { email: string; password: string; isSignup: boolean },
    { status: string; content?: { token: string; user: any }; error?: string }
  ];
  "auth/storeToken": [{ token: string; user: any }, void];
  "auth/getStoredToken": [
    {},
    { status: string; content?: { token: string; user: any }; error?: string }
  ];
  "auth/clearToken": [{}, void];
  
  reportError: [any, void];
  closeSidebar: [undefined, void];
};

export type ToWebviewOrCoreFromIdeProtocol = {
  didChangeActiveTextEditor: [{ filepath: string }, void];
};
