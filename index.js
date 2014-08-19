var EventEmitter = require('events').EventEmitter
var util = require('util')
var dockersps = require('dockers-ps')
var shuffle = require('shuffle-array')

function leastBusyFrom(servers){
	var lowestCount = -1
	var serverkey = null
	var serverKeys = Object.keys(servers || {})
	shuffle(serverKeys)
	serverKeys.forEach(function(key){
		var server = servers[key]
		var jobs = server.jobs
		if(lowestCount<0 || jobs.length<lowestCount){
			lowestCount = jobs.length
			serverkey = key
		}
	})
	var server = servers[serverkey]
	return {
		hostname:server.hostname,
		docker:server.docker
	}
}

function Dowding(opts){
	opts = opts || {}
	EventEmitter.call(this)
	if(!opts.inventory){
		throw new Error('dowding needs an inventory option')
	}
	this._inventory = opts.inventory
	this._leastBusy = opts.leastBusy || function(servers, done){
		done(null, leastBusyFrom(servers))
	}
	this._cluster = dockersps(opts.inventory)
}

util.inherits(Dowding, EventEmitter)

module.exports = Dowding

// remove servers that have a job of the same service running
Dowding.prototype.filterExclusion = function(name, done){
	var self = this;
	var parts = name.split('.')
	var pid = parts.pop()
	var basename = parts.join('.')
	self._cluster.ps(function(err, list, collection){

		var hotServers = {}
		Object.keys(collection.names || {}).forEach(function(key){
			if(key.indexOf('container:/' + basename)==0){
				hotServers[collection.names[key]] = true
			}
		})
		var finalMap = {}
		Object.keys(collection.servers || {}).forEach(function(key){
			if(!hotServers[key]){
				finalMap[key] = collection.servers[key]
			}
		})
		done(null, finalMap)
	})
}

Dowding.prototype.findParent = function(name, done){
	var self = this;
	self._cluster.find(name, done)
}

Dowding.prototype.allocate = function(opts, done){
	var self = this;
	if(arguments.length<=1){
		done = opts
		opts = {}
	}
	opts = opts || {}

	// this is a targeted allocation - parent must exist or error
	if(opts.parent){
		self.findParent(opts.parent, function(err, parent){
			if(err || !parent){
				return done(err || 'no container: ' + opts.parent)
			}
			done(null, parent)
		})
	}
	// this is a mutual exclusion
	else if(opts.name.indexOf('.')>0){
		self.filterExclusion(opts.name, function(err, servers){
			if(err) return done(err)
			if(Object.keys(servers || {}).length<=0){
				return done('no server found')
			}
			self._leastBusy(servers, done)
		})
	}
	// normal leastBusy allocation
	else{
		self.leastBusy(done)
	}

}

Dowding.prototype.leastBusy = function(done){
	var self = this;
	self._cluster.ps(function(err, list, collection){
		if(err) return done(err)
		self._leastBusy(collection.servers, done)
	})
}

module.exports = function(opts){
	return new Dowding(opts)
}