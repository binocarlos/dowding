dowding
=======

Docker cluster scheduler

![Battle Of Britain Ops Room](https://github.com/binocarlos/dowding/raw/master/opsroom.jpg)

The name is a tribute to the [real master planner](http://en.wikipedia.org/wiki/Hugh_Dowding,_1st_Baron_Dowding)

## install

```
$ npm install dowding
```

## usage

```js
var dowding = require('dowding')

var scheduler = dowding({
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
	},

	leastBusy:function(servers, done){

		// this is a naive function that always returns the first server
		// you can have any logic you want here
		done(null, servers[0])
	}

})
```

## allocating

When a new container wants to be run - we must pick a server for it to run on.

There are a few rules Dowding will follow when making this decision:

#### volumes-from

If a container has volumes-from then it will be routed to the server that hosts the targeted container.

#### mutual exclusion

If a container has a name of the following format:

```
<jobname>.<pid>
```

For example:

```
auth.abc
```

and

```
auth.xyz
```

These 2 auth containers will not be allocated onto the same server.

Here is an example of running the allocation:

```js
scheduler.allocate({
	name:'auth.abc',
	volumesFrom:'otherjob'
}, function(err, server){
	// server is one object from the inventory
})
```

If you just want a server you can omit the filter information:

```js
scheduler.allocate(function(err, server){
	// server is one object from the inventory
})
```

#### least-busy

When the above rules are not applied - the default behaviour is to pick the `least busy` server.

Least busy is determined by the number of containers running on each host.

You can pass a function to override this decision.

## api

#### `var scheduler = dowding(opts)`

Create a new scheduler passing the following options:

 * inventory - a function that will return a list of servers on our network
 * leastBusy - a function that defines the logic for picking the least busy of our servers

#### `scheduler.allocate([opts], function(err, server){})

Allocate a docker server for a job

Opts is an optional object used to filter the allocation - it has these keys:

 * name - the name of the job, possibly in <job>.<pid> format
 * volumesFrom - allocate this job to the server that the volumesFrom job is running

## license

MIT