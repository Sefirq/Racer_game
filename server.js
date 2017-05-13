var path = require('path');
var express = require('express');
var app = express();

app.get('/', function(req, res) {
    res.sendFile(path.resolve(__dirname, 'index.html'));
});
app.use(express.static(__dirname));

app.listen(3000, function() {
    console.log('Server is listening on http://localhost:3000');
});