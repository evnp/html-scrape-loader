# html-scrape-loader
A Webpack loader for scraping HTML
```
npm install html-scrape-loader
```

# Usage with Webpack
```
loaders: [
    {
        test: /\.(json|html)$/,
        loader: 'html-scrape
    },
    ...
```
To specify scrape selectors universally:
```
loaders: [
    {
        test: /\.(json|html)$/,
        loader: 'html-scrape?' + JSON.stringify({
            paragraphs: '.post p',
            intro: ['.post, .content', '.intro'],
            content: ['.content', {
                heading: 'h1, h2, h3',
                body: '.body'
            }]
        })
    },
    ...
```
Input files can either be `.html` - containing the HTML content to be scraped - or `.json` files of the form:
```
{
    "html": "<some><html><to><scrape></scrape></to></html></some>",
    "selectors": {
        "paragraphs": ".post p",
        "intro": [".post", ".content", ".intro"],
        "content": [".content", {
            "heading": "h1, h2, h3",
            "body": ".body"
        }]
    })
}
```

# Selector format
The `selectors` object is an arbitrarily nested set of keys mapped to standard CSS3 selector strings. Arrays of selector strings will be joined with spaces (traversing down the DOM hierarchy):
```
[".post", ".content", ".intro"] => ".post .content .intro"
```
as opposed to commas, as in the heading selector above (selecting `h1` OR `h2` OR `h3`):
```
"h1, h2, h3"
```
Nested selector objects will be scoped to the selector strings above and around them:
```
"content": [".content", {     "content": {
    "heading": ".heading", =>     "heading": ".content .heading",
    "body": ".body"               "body": ".content .body"
}]                            }]
```
This will also work with selectors like `h1, h2, h3`.

# Return format
The return format matches the selector object structure:
```
{                                                 {
    "paragraphs": ".post p",                          "paragraphs": ["innerHTML from '.post p' elements", ...],
    "intro": [".post", ".content", ".intro"], =>      "intro": ["innerHTML from '.post .content .intro' elements". ...]
    "content": [".content", {                         "content": {
        "heading": ".heading",                            "heading": ["innerHTML from '.content .heading' elements", ...]
        "body": ".body"                                   "body": ["innerHTML from '.content .body' elements", ...]
    }]                                                }
}                                                 }

```
Scraped content is always returned as arrays of strings since there is always the possibility that multiple elements will match the selector.

# Scraping with URLs
When using `.json` input files, a `url` key can be used instead of `html` to scrape content directly from the web:
```
{
    "url": "https://github.com/evnp/html-scrape-loader",
    "selectors": {
        "paragraphs": ".post p",
        "intro": [".post", ".content", ".intro"],
        "content": [".content", {
            "heading": "h1, h2, h3",
            "body": ".body"
        }]
    })
}
```

# Usage outside of Webpack
```
var scraper = require('html-scrape-loader');

var htmlResult = scraper({
    html: "<some><html><to><scrape></scrape></to></html></some>",
    selectors: {
        paragraphs: '.post p',
        intro: ['.post, .content', '.intro'],
        content: ['.content', {
            heading: 'h1, h2, h3',
            body: '.body'
        }]
    }
});

scraper({
    url: "https://github.com/evnp/html-scrape-loader",
    selectors: {
        paragraphs: '.post p',
        intro: ['.post, .content', '.intro'],
        content: ['.content', {
            heading: 'h1, h2, h3',
            body: '.body'
        }]
    }
}, function (urlResult) {
    ... do something with scraped data ...
});
```
