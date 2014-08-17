var dowding = require('../')
var tape     = require('tape')
var etcdjs = require('etcdjs')

var etcd = etcdjs('192.168.8.120:4001')
var baseKey = '/dowdingtest'

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

var scheduler = dowding({
  etcd:'192.168.8.120:4001,192.168.8.121:4001,192.168.8.122:4001',
  baseKey:baseKey,
  inventory:function(done){
    done(null, allServers)
  }
})

tape('reset etcd keys', function(t){
  etcd.del(baseKey, {
    recursive:true
  }, function(){
    t.end()
  })
})

tape('leastBusy returns one server', function(t){
  scheduler.leastBusy(function(err, server){
    t.ok(server.hostname.indexOf('node')==0, 'server has hostname')
    t.end()
  })
})

tape('pin and check allocate returns correct server', function(t){

  function runPinTest(node, done){
    scheduler.pin('apples', node, function(err){
      if(err){
        t.fail(err, 'pin apples to ' + node)
        t.end()
        return
      }
      setTimeout(function(){
        scheduler.isPinned('apples', function(err, server){
          t.equal(server.hostname, node, 'the pinned hostname is correct')
          scheduler.unpin('apples', function(err){
            setTimeout(function(){
              scheduler.isPinned('apples', function(err, server){
                t.notOK(server, 'there is no server')
                setTimeout(done, 100)
              })
            }, 100)
          })
        })
      }, 100)
    })
  }

  runPinTest('node1', function(){
    runPinTest('node2', function(){
      runPinTest('node3', function(){
        t.end()
      })
    })
  })
})