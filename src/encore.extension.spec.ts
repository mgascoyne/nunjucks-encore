import * as fs from 'fs';
import { Volume } from 'memfs';
import { EncoreExtension } from './encore.extension';

/**
 * Tests for Nunjucks Webpack Encore Extension.
 */

// Mocking Node's fs module for tests
jest.mock(`fs`, () => {
  const fs = jest.requireActual(`fs`);
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const unionfs = require(`unionfs`).default;
  unionfs.reset = () => {
    // fss is unionfs' list of overlays
    unionfs.fss = [fs];
  };
  return unionfs.use(fs);
});

describe('EncoreExtension', () => {
  let extension: EncoreExtension = null;
  let extensionIntegrity: EncoreExtension = null;

  /**
   * SetUp test environment.
   */
  beforeEach(() => {
    extension = new EncoreExtension({
      entrypointsFilename: '/vfs/entrypoints.json',
      manifestFilename: '/vfs/manifest.json',
    });

    extensionIntegrity = new EncoreExtension({
      entrypointsFilename: '/vfsIntegrity/entrypoints.json',
      manifestFilename: '/vfs/manifest.json',
    });

    // Setup virtual filesystem for tests
    const vfs = Volume.fromJSON(
      {
        'entrypoints.json': JSON.stringify({
          entrypoints: {
            entry1: {
              js: ['/file2.js', '/file1.js'],
              css: ['file2.css', 'file1.css'],
            },
            entry2: {
              js: ['/file4.js', '/file3.js'],
              css: ['file4.css', 'file3.css'],
            },
          },
        }),
        'manifest.json': JSON.stringify({
          '/assets/assetFile.txt': 'assetContent',
        }),
      },
      '/vfs',
    );

    // Setup virtual filesystem for entrypoints with integrity hashes for tests
    const vfsIntegrity = Volume.fromJSON(
      {
        'entrypoints.json': JSON.stringify({
          entrypoints: {
            entry1: {
              js: ['/file2.js', '/file1.js'],
              css: ['file2.css', 'file1.css'],
            },
            entry2: {
              js: ['/file4.js', '/file3.js'],
              css: ['file4.css', 'file3.css'],
            },
          },
          integrity: {
            '/file2.js': 'sha384-002',
            '/file1.js': 'sha384-001',
            'file2.css': 'sha384-004',
            'file1.css': 'sha384-003',
            '/file4.js': 'sha384-006',
            '/file3.js': 'sha384-005',
            'file4.css': 'sha384-008',
            'file3.css': 'sha384-007',
          },
        }),
      },
      '/vfsIntegrity',
    );

    const fsMock: any = fs;
    fsMock.use(vfs);
    fsMock.use(vfsIntegrity);
  });

  /**
   * TearDown test environment.
   */
  afterEach(() => {
    (fs as any).reset();
  });

  /**
   * Test that extension supports all suggested types.
   */
  it('supports suggested tags', () => {
    expect(extension.tags).toContain('encore_entry_link_tags');
    expect(extension.tags).toContain('encore_entry_script_tags');
    expect(extension.tags).toContain('asset');
  });

  /**
   * Test that the parser works correctly.
   */
  it('parses correctly', () => {
    const nextTokenMock = jest.fn(() => {
      return { value: 'token_value' };
    });
    const parseSignatureMock = jest.fn(() => ['arg1', 'arg2']);
    const advanceAfterBlockEndMock = jest.fn();
    const parserMock = class {
      nextToken = nextTokenMock;
      parseSignature = parseSignatureMock;
      advanceAfterBlockEnd = advanceAfterBlockEndMock;
    };

    const callExtensionMock = class {};

    const nodesMock = class {
      CallExtension = callExtensionMock;
    };

    const lexerMock = jest.fn();

    expect(
      extension.parse(new parserMock(), new nodesMock(), lexerMock),
    ).toBeInstanceOf(callExtensionMock);

    expect(nextTokenMock).toHaveBeenCalled();
    expect(parseSignatureMock).toHaveBeenCalledWith(null, false);
    expect(advanceAfterBlockEndMock).toHaveBeenCalledWith('token_value');
  });

  /**
   * Test for encore_link_tags extension.
   */
  it('outputs correct link tags', () => {
    expect(extension.encore_entry_link_tags({}, 'entry1', 'entry2')).toEqual({
      length: 164,
      val:
        '<link rel="stylesheet" href="file1.css">\n' +
        '<link rel="stylesheet" href="file2.css">\n' +
        '<link rel="stylesheet" href="file3.css">\n' +
        '<link rel="stylesheet" href="file4.css">\n',
    });

    // now get data from cache
    (fs as any).reset();
    expect(extension.encore_entry_link_tags({}, 'entry1', 'entry2')).toEqual({
      length: 164,
      val:
        '<link rel="stylesheet" href="file1.css">\n' +
        '<link rel="stylesheet" href="file2.css">\n' +
        '<link rel="stylesheet" href="file3.css">\n' +
        '<link rel="stylesheet" href="file4.css">\n',
    });
  });

  /**
   * Test for encore_link_tags extension with integrity hashes.
   */
  it('outputs correct link tags with integrity hashes', () => {
    expect(extensionIntegrity.encore_entry_link_tags({}, 'entry1', 'entry2')).toEqual({
      length: 256,
      val:
        '<link rel="stylesheet" href="file1.css" integrity="sha384-003">\n' +
        '<link rel="stylesheet" href="file2.css" integrity="sha384-004">\n' +
        '<link rel="stylesheet" href="file3.css" integrity="sha384-007">\n' +
        '<link rel="stylesheet" href="file4.css" integrity="sha384-008">\n',
    });

    // now get data from cache
    (fs as any).reset();
    expect(extensionIntegrity.encore_entry_link_tags({}, 'entry1', 'entry2')).toEqual({
      length: 256,
      val:
        '<link rel="stylesheet" href="file1.css" integrity="sha384-003">\n' +
        '<link rel="stylesheet" href="file2.css" integrity="sha384-004">\n' +
        '<link rel="stylesheet" href="file3.css" integrity="sha384-007">\n' +
        '<link rel="stylesheet" href="file4.css" integrity="sha384-008">\n',
    });
  });

  /**
   * Test for encore_link_tags extension with missing arguments.
   */
  it('cannot outputs correct link tags due to missing arguments', () => {
    expect(extension.encore_entry_link_tags({})).toEqual({
      length: 0,
      val: '',
    });
  });

  /**
   * Test for encore_script_tags extension.
   */
  it('outputs correct script tags', () => {
    expect(extension.encore_entry_script_tags({}, 'entry1', 'entry2')).toEqual({
      length: 136,
      val:
        '<script src="/file1.js"></script>\n' +
        '<script src="/file2.js"></script>\n' +
        '<script src="/file3.js"></script>\n' +
        '<script src="/file4.js"></script>\n',
    });

    // now get data from cache
    (fs as any).reset();
    expect(extension.encore_entry_script_tags({}, 'entry1', 'entry2')).toEqual({
      length: 136,
      val:
        '<script src="/file1.js"></script>\n' +
        '<script src="/file2.js"></script>\n' +
        '<script src="/file3.js"></script>\n' +
        '<script src="/file4.js"></script>\n',
    });
  });

  /**
   * Test for encore_script_tags extension with integrity hashes.
   */
  it('outputs correct script tags with integrity hashes', () => {
    expect(extensionIntegrity.encore_entry_script_tags({}, 'entry1', 'entry2')).toEqual({
      length: 228,
      val:
        '<script src="/file1.js" integrity="sha384-001"></script>\n' +
        '<script src="/file2.js" integrity="sha384-002"></script>\n' +
        '<script src="/file3.js" integrity="sha384-005"></script>\n' +
        '<script src="/file4.js" integrity="sha384-006"></script>\n',
    });

    // now get data from cache
    (fs as any).reset();
    expect(extensionIntegrity.encore_entry_script_tags({}, 'entry1', 'entry2')).toEqual({
      length: 228,
      val:
        '<script src="/file1.js" integrity="sha384-001"></script>\n' +
        '<script src="/file2.js" integrity="sha384-002"></script>\n' +
        '<script src="/file3.js" integrity="sha384-005"></script>\n' +
        '<script src="/file4.js" integrity="sha384-006"></script>\n',
    });
  });

  /**
   * Test for encore_script_tags extension with missing arguments.
   */
  it('cannot outputs correct script tags due to missing arguments', () => {
    expect(extension.encore_entry_script_tags({})).toEqual({
      length: 0,
      val: '',
    });
  });

  /**
   * Test for asset extension.
   */
  it('output correct asset', () => {
    expect(extension.asset({}, '/assets/assetFile.txt')).toEqual({
      length: 12,
      val: 'assetContent',
    });

    // now get data from cache
    (fs as any).reset();
    expect(extension.asset({}, '/assets/assetFile.txt')).toEqual({
      length: 12,
      val: 'assetContent',
    });
  });

  /**
   * Test for asset extension with undefined asset.
   */
  it('outputs empty string if asset not found', () => {
    expect(extension.asset({}, '/assets/unknown.txt')).toEqual({
      length: 0,
      val: '',
    });
  });

  /**
   * Test for asset extension with missing arguments.
   */
  it('cannot outputs correct asset due to missing arguments', () => {
    expect(extension.asset({})).toEqual({
      length: 0,
      val: '',
    });
  });
});
