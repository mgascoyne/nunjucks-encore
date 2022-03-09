import * as fs from 'fs';
import { Extension, runtime } from 'nunjucks';
import SafeString = runtime.SafeString;

/**
 * Nunjucks Webpack Encore Extension.
 */
export class EncoreExtension implements Extension {
  private entrypointsCache: object | undefined = undefined;
  private manifestCache: object | undefined = undefined;

  /**
   * Constructor.
   *
   * @param {object} options - Options for the extension.
   */
  constructor(
    private readonly options: EncoreExtensionOptions = {
      entrypointsFilename: 'entrypoints.json',
      manifestFilename: 'manifest.json',
    },
  ) {}

  /**
   * Tags this extension supports.
   */
  get tags(): string[] {
    return ['encore_entry_link_tags', 'encore_entry_script_tags', 'asset'];
  }

  /**
   * Parse tag.
   *
   * @param {any} parser - Nunjucks parser
   * @param {any} nodes - Nunjucks nodes
   * @param {any} lexer - Nunjucks lexer
   */
  public parse(parser, nodes, lexer) {
    // get the tag token
    const tok = parser.nextToken();

    // parse the args and move after the block end. passing true
    // as the second arg is required if there are no parentheses
    const args = parser.parseSignature(null, false);
    parser.advanceAfterBlockEnd(tok.value);

    return new nodes.CallExtension(this, tok.value, args, []);
  }

  /**
   * Get Encore link tags for entry.
   *
   * @param {any} args - Entry name
   * @return {string}
   */
  public encore_entry_link_tags(...args: any): SafeString {
    const context = args.shift();

    if (args.length === 0) {
      return new SafeString('');
    }

    const entrypoints = this.getEntrypoints();
    const cssFiles = [];

    args.forEach((entryName) => {
      if (entrypoints[entryName] && entrypoints[entryName].css) {
        entrypoints[entryName].css.forEach((cssFile) => {
          cssFiles.push(cssFile);
        });
      }
    });

    let result = '';

    this.getUniqueFiles(cssFiles).forEach((cssFile) => {
      result += `<link rel="stylesheet" href="${cssFile}">\n`;
    });

    return new SafeString(result);
  }

  /**
   * Get Encore script tags for entry.
   *
   * @param {any} args - Entry name
   * @return {string}
   */
  public encore_entry_script_tags(...args: any): SafeString {
    const context = args.shift();

    if (args.length === 0) {
      return new SafeString('');
    }

    const entrypoints = this.getEntrypoints();
    const scriptFiles = [];

    args.forEach((entryName) => {
      if (entrypoints[entryName] && entrypoints[entryName].js) {
        entrypoints[entryName].js.forEach((scriptFile) => {
          scriptFiles.push(scriptFile);
        });
      }
    });

    let result = '';

    this.getUniqueFiles(scriptFiles).forEach((scriptFile) => {
      result += `<script src="${scriptFile}"></script>\n`;
    });

    return new SafeString(result);
  }

  /**
   * Get real asset filename.
   *
   * @param {any} args - Asset filename
   * @return {string}
   */
  public asset(...args: any): SafeString {
    const context = args.shift();

    if (args.length == 0) {
      return new SafeString('');
    }

    const assetName = args.shift();
    const manifest = this.getManifest();

    return new SafeString(manifest[assetName] || '');
  }

  /**
   * Get entrypoints from file or cache.
   *
   * @private
   * @return {object}
   */
  private getEntrypoints(): object {
    if (this.entrypointsCache) {
      return this.entrypointsCache;
    }

    try {
      this.entrypointsCache = JSON.parse(
        fs.readFileSync(this.options.entrypointsFilename, 'utf8'),
      ).entrypoints;
    } catch {}

    return this.entrypointsCache;
  }

  /**
   * Get manifest from file or cache.
   *
   * @private
   * @return {object}
   */
  private getManifest(): object {
    if (this.manifestCache) {
      return this.manifestCache;
    }

    try {
      this.manifestCache = JSON.parse(
        fs.readFileSync(this.options.manifestFilename, 'utf8'),
      );
    } catch {}

    return this.manifestCache;
  }

  /**
   * Get unique sorted files array.
   *
   * @private
   * @param {Array<string>} files - Unsorted Files array
   * @return {Array<string>}
   */
  private getUniqueFiles(files: Array<string>): Array<string> {
    files = Array.from(
      files.sort((file1: string, file2: string): number => {
        return file1 < file2 ? -1 : 1;
      }),
    );

    return Array.from(new Set(files));
  }
}

/**
 * Options for EncoreExtension.
 */
export interface EncoreExtensionOptions {
  entrypointsFilename: string;
  manifestFilename: string;
}
