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

To allocate a new container:

```js
scheduler.allocate({
	name:'myjob'
}, function(err, server){
	// server is an entry from our inventory	
})
```

Allocate a server that does not run another 'myjob' container (mutual exclusion):

```js
scheduler.allocate({
	name:'myjob.2'
}, function(err, server){
	// server will not be where myjob.1 is running
})
```

Allocate the server that is running the `basevolume` container:

```js
scheduler.allocate({
	name:'mydatabase',
	parent:'basevolume'
}, function(err, server){
	// server will be the same as where basevolume is running
	// it will pass an error if basevolume is not found
})
```

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

#### parent

You can instruct dowding to allocate a container onto a server that another container is running.

This is useful in scenarios like `--volumes-from` where one container has a local dependency on another.

#### least-busy

When there are multiple servers that could be choosen - the default behaviour is to pick the `least busy` server.

Least busy is determined by the number of containers running on each host.

You can pass a function to override this decision.

The function will be passed an object where the keys are the server hostname and the values are objects with the following properties:

 * hostname
 * docker
 * jobs

You can use this information to decide which server should be allocated.

## api

#### `var scheduler = dowding(opts)`

Create a new scheduler passing the following options:

 * inventory - a function that will return a list of servers on our network
 * leastBusy - a function that defines the logic for picking the least busy of our servers

#### `scheduler.allocate([opts], function(err, server){})

Allocate a docker server for a job

Opts is an optional object used to filter the allocation - it has these keys:

 * name - the name of the container, possibly in <job>.<pid> format for mutual exclusion
 * parent - the name of a parent container - the job will be routed to the server it is running on

#### `scheduler.find(name, function(err, server){})

Find which server that a container is running - server can be null if the container is not found.

## license

MIT