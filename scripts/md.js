var spawn = require('child_process').exec;

hexo.on('new', function(data){
  spawn('start  "D:/Program Files (x86)/MarkdownPad 2/MarkdownPad2.exe" ' + data.path);
});