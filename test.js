var cp = require('child_process')
var dowding = require('./')
var tape     = require('tape')
var async = require('async')

var allServers = [{
  hostname:'node1',
  docker:'192.168.8.120:2375'
},{
  hostname:'node2',
  docker:'192.168.8.121:2375'
},{
  hostname:'node3',
  docker:'192.168.8.122:2375'
}]

var jobs = ['dowdingtest.1', 'dowdingtest.2', 'dowdingtest.3']

var scheduler = dowding({
  inventory:function(done){
    done(null, allServers)
  }
})


function getTestCommand(name, server){
  return 'docker -H tcp://' + server + ' run --name ' + name + ' -d binocarlos/bring-a-ping --timeout 1000'
}

// run 3 containers under the same namespace and make sure they are allocated across
// the 3 servers evenly
function runExclusion(t, done){
  
  var allocated = {}
  async.forEachSeries(jobs, function(job, nextJob){
    scheduler.allocate({
      name:job
    }, function(err, server){
      allocated[job] = server
      var command = getTestCommand(job, server.docker)
      cp.exec(command, function(err, stdout, stderr){
        if(stderr) err = stderr.toString()
        if(err) return nextJob(err)
      })
    })
  }, function(err){
    if(err) return done(err)
    done(null, allocated)
  })
}

function killExclusion(done){
  async.forEachSeries(allServers, function(server, nextServer){
    async.forEachSeries(jobs, function(job, nextJob){
      cp.exec('docker -H tcp://' + server.docker + ' stop ' + job, function(){
        cp.exec('docker -H tcp://' + server.docker + ' rm ' + job, function(){
          nextJob()
        })
      })
    }, function(){
      nextServer()
    })
  }, function(err){
    done()
  })
}


tape('leastBusy returns one server', function(t){
  scheduler.leastBusy(function(err, server){
    t.ok(server.hostname.indexOf('node')==0, 'server has hostname')
    t.end()
  })
})

tape('mutual exclusion', function(t){

  // lets run it 10 times to avoid it randomly having allocated correctly
  var counter = 0

  function nextTest(){
    counter++
    if(counter<=1){
      runExclusion(t, function(err, allocations){
        killExclusion(function(){
          nextTest()
        })
      })
    }
    else{
      t.end()
    }
  }

  nextTest()
})
