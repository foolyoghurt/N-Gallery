var md = require( "markdown" ).markdown;
var fs = require('fs');

fs.readdir('./', function(err, files) {
  if (err) {
    console.log(err);
    return;
  } 
  
  files.forEach(function(file) {
    if (file.slice(-3) !== '.md') {
      return;
    }
    
    fs.readFile(file, {encoding: 'utf8'}, function(err, data) {
      if (err) {
        console.log(err);
        return;
      }

      fs.writeFile(file.replace('.md', '.ejs'), md.toHTML(data));
      
      // generate default doc
      if (file == 'help-en.md') {
        fs.writeFile('help.ejs', md.toHTML(data));
      }
    });
  });
});
