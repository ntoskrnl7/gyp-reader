// you must growl every time you use this module.
module.exports = gr

var compareVersions = require('compare-versions');
var exec = require('child_process').execSync;
var python_version = exec('python -c "import platform; print(platform.python_version())"').toString().trim();

var spawn = require("child_process").spawn
, pyprog = "import sys, ast, json;"
         + "c = open(sys.argv[1]).read();"
         + "d = ast.literal_eval(c);"
         + (compareVersions(python_version, "3.0") >=0 ? "print(json.dumps(d))" : "print json.dumps(d)")
, StringDecoder = require("string_decoder").StringDecoder

function gr (file, cb) {
  var python = process.env.PYTHON || "python"
  , child = spawn(python, ["-c", pyprog, file])
  , decoder = new StringDecoder("utf8")
  , out = ""
  , done = false

  child.on("exit", finish)
  child.on("close", finish)
  child.stdout.on("end", finish)

  function finish (code) {
    if (done) return
    done = true
    if (code) {
      var er = new Error("Child exited with "+code)
      er.errno = code
      er.code = code
      return cb(er)
    }
    try {
      return cb(null, JSON.parse(out))
    } catch (er) {
      er.code = "EBADJSON"
      return cb(er)
    }
  }

  child.stdout.on("data", function (c) {
    out += decoder.write(c)
  })
}
