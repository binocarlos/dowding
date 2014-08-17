dowding
=======

Master planner - docker cluster scheduler backed by etcd

![Battle Of Britain Ops Room](https://github.com/binocarlos/dowding/raw/master/opsroom.jpg)

The name is a tribute to the [real master planner](http://en.wikipedia.org/wiki/Hugh_Dowding,_1st_Baron_Dowding)

## install

```
$ npm install dowding
```

## usage

The job of dowding is to pick and log servers for jobs to run on.

```js
var dowding = require('dowding')

var scheduler = dowding({
	// pass multiple etcd endpoints using commas or an array
	etcd:'192.168.8.120:4001,192.168.8.121:4001,192.168.8.122:4001',
	
	// the key in etcd under which dowding will keep state
	baseKey:'/schedule',

	// pass a function that will list our inventory
	inventory:function(done){

		// the inventory is an array of objects
		// each object has 'hostname' and 'docker' properties
		// servers can also have arbitrary meta data

		var servers = [{
			hostname:'host1',
			docker:'192.168.8.120:2375',
			tags:'apple,peach'
		},{
			hostname:'host2',
			docker:'192.168.8.121:2375',
			tags:'orange'
		}]

		done(null, servers)
	}

})
```

#### allocating

The most basic usage is to get the server that is least busy (TBC! currently its just random):

```js
scheduler.leastBusy(function(err, server){
	// server is an object from the inventory
})
```

For general usage you want to either route a job to its pinned location or to allocate a new server if its not pinned - the 'allocate' function does that:

```js
scheduler.allocate(id, function(err, server){
	// server is an object from the inventory
	// if the job was pinned then the answer is pre-determined
})
```

#### pinning

When using things like docker volumes, its useful to 'pin' a job to a server.

Pinning a job (by its id) means fixing its location so next time we run the same job it will end up on the same box as its volume.

```js
// server is the hostname of the server to pin to
scheduler.pin(id, serverHostname, function(err){
	// id is now pinned to serverHostname
})

// remove the pinned location of a job (in case of failure)
scheduler.unpin(id, function(err){
	
})

// you can ask the scheduler if a job has been pinned (and where that is)
scheduler.isPinned(id, function(err, server){
	// server is an object from the inventory
})
```

You can also pin a job to where another job is - this is useful for volumes-from:

```js
// targetid is the id of the job to pin to
scheduler.pinTo(id, targetid, function(err){
	// id is routed to whereever targetid is living
})
```

#### services

Services are jobs that should stay running - by telling dowding about services you are able to fetch the desired and actual state.

```js
// add a service to the scheduler by passing the id and job description
// this means we can get a list of desired and current state
scheduler.addService(id, job, function(err){

})

// remove a service from the scheduler
scheduler.removeService(id, function(err){

})

// list all services
scheduler.listServices(function(err){

})
```

## license

MIT