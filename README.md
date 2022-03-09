# Nunjucks Encore

[![Build][github-actions-image]][github-actions-url]
[![NPM Version][npm-image]][npm-url]
[![NPM Downloads][downloads-image]][downloads-url]

Nunjucks extension for using [Webpack Encore](https://www.npmjs.com/package/@symfony/webpack-encore). With this
extension, you can include CSS, JavaScript and assets in your Nunjucks templates.

### How to install it?

```
$ npm install nunjucks-encore
```

### How to use it?

```js
const encoreExtension = require("nunjucks-encore");

env.addExtension(
  'encore-extension',
  new EncoreExtension({
    entrypointsFilename: 'path/to/entrypoints.json',
    manifestFilename: 'path/to/manifest.json',
  }),
);
```

or

```js
import { EncoreExtension } from 'nunjucks-encore';

env.addExtension(
  'encore-extension',
  new EncoreExtension({
    entrypointsFilename: 'path/to/entrypoints.json',
    manifestFilename: 'path/to/manifest.json',
  }),
);
```

The extension adds the tags `encore_entry_link_tags`, `encore_entry_script_tags` and `asset` to Nunjucks.

#### Encore entry link tags

You can add CSS files to your template with the `encore_entry_link_tags` tag. The extension will render the whole `<link>` tag.

```html
<html>
  <head>
    {% encore_entry_link_tags('entry1', 'entry2') %}
  </head>
  <body></body>
</html>
```

#### Encore entry script tags

You can add JS files to your template with the `encore_entry_script_tags` tag. The extension will render the whole `<script>` tag.

```html
<html>
<head>
</head>
<body>
  {% encore_entry_script_tags('entry1', 'entry2') %}
</body>
</html>

```

#### Assets

You can add asset files to your template with the `asset` tag:

```html
<img src="{% asset('images/image1.png') %}" />
```

[npm-image]: https://img.shields.io/npm/v/nunjucks-encore.svg?label=NPM%20Version
[npm-url]: https://npmjs.org/package/nunjucks-encore
[downloads-image]: https://img.shields.io/npm/dt/nunjucks-encore?label=Downloads
[downloads-url]: https://npmjs.org/package/nunjucks-encore
[github-actions-image]: https://img.shields.io/github/workflow/status/mgascoyne/nunjucks-encore/Tests/master?label=Build
[github-actions-url]: https://github.com/mgascoyne/nunjucks-encore/actions
