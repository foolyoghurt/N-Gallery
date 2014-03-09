var md = require( "markdown" ).markdown;
var fs = require('fs');

fs.readFile('help.md', {encoding: 'utf8'}, function(err, data) {
  fs.writeFile('help.ejs', md.toHTML(data));
});
