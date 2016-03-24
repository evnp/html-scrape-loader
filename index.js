/*
    MIT License http://www.opensource.org/licenses/mit-license.php
    Created by: Evan Purcer <evanpurcer@gmail.com> (http://evnp.ca)

    Input format:
    {
        paragraphs: '.post p',
        intro: ['.post, .content', '.intro'],
        content: ['.content', {
            heading: 'h1, h2, h3',
            body: '.body'
        }]
    }

    Output format:
    {
        paragraphs: [
            '.post p text 1',
            '.post p text 2',
            '.post p text 3'
        ],
        intro: [
            '.post .intro text',
            '.content .intro text'
        ],
        content: {
            heading: [
                '.content h1 text',
                '.content h2 text',
                '.content h3 text'
            ],
            body: [
                '.body text 1',
                '.body text 2',
                '.body text 3'
            ]
        }
    }
*/

var http = require('http')
  , https = require('https')
  , util = require('loader-utils')
  , jsdom = require('jsdom').jsdom
  , jQuery = require('jquery')
  ;

function fromPairs(pairs) {
    var index = -1
      , length = pairs ? pairs.length : 0
      , result = {}
      , pair = null
      ;

    while (++index < length) {
        pair = pairs[index];
        result[pair[0]] = pair[1];
    }

    return result;
}

function merge(objects) {
    var merged = {};

    objects.forEach(function (object) {
        Object.keys(object).forEach(function (key) {
            merged[key] = object[key];
        });
    });

    return merged;
}

function scrape(selectors, $context) {
    return fromPairs(Object.keys(selectors).map(function (key) {
        var $elements = $context
          , selArray = selectors[key]
          ;

        selArray = (
            typeof selArray === 'string' ? [selArray] : selArray  // ensure array
        ).filter(function (sel) {  // use string selectors to search down $elements hierarchy
            $elements = typeof sel === 'string' ? $elements.find(sel) : $elements;
            return typeof sel === 'object';  // filter down to object selectors only
        });

        if (selArray.length) {
            return [key, scrape(merge(selArray), $elements)];
        } else {
            return [key, $elements.map(function () {
                return this.innerHTML.trim().replace(/\s/g, ' ');
            }).get()];
        }
    }));
}

function prepareExport(loader, html, selectors) {
    var $, value;

    if (selectors) {
        $ = jQuery(jsdom(html).defaultView);
        value = scrape(selectors, $('html'));
    } else {
        value = html;
    }

    loader.value = [value];
    return "module.exports = " + JSON.stringify(value, undefined, "  ") + ";";
}

module.exports = function (source) {
    this.cacheable && this.cacheable();

    var loader    = this
      , json      = null
      , selectors = null
      , html      = null
      , url       = null
      ;

    try {
        json = JSON.parse(source);
    } catch (e) {}

    if (json) {
        selectors = json.selectors;
        html = json.html;
        url = json.url;
    } else {
        if (source.indexOf('<') !== -1 && source.indexOf('>') !== -1) {
            html = source;
        } else {
            url = source;
        }
    }

    if (!selectors && loader.query) {
        selectors = util.parseQuery(loader.query);
    }

    if (html) {
        return prepareExport(loader, html, selectors);
    } else if (url) {
        var callback = this.async();

        (url.startsWith('https') ? https : http).get(url, function (response) {
            html = '';
            response.on('data', function (chunk) { html += chunk; });
            response.on('end', function () {
                callback(null, prepareExport(loader, html, selectors))
            });
        });
    } else {
        throw new Error(
            "You must provide an html or url string defining the html to be scraped:\r\n" +
            "  - if the source file is .html, as its contents\r\n" +
            "  - if the source file is .json, under 'html' or 'url' top-level keys"
        );
    }
};
