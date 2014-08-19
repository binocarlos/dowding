var EventEmitter = require('events').EventEmitter
var util = require('util')
var dockersps = require('dockers-ps')

function Dowding(opts){
	opts = opts || {}
	EventEmitter.call(this)
	if(!opts.inventory){
		throw new Error('dowding needs an inventory option')
	}
	this._inventory = opts.inventory
	this._cluster = dockersps(opts.inventory)
}

util.inherits(Dowding, EventEmitter)

module.exports = Dowding

Dowding.prototype.allocate = function(opts, done){
	if(arguments.length<=1){
		done = opts
		opts = {}
	}

	
}

Dowding.prototype.leastBusy = function(done){
	var self = this;
	self._cluster.ps(function(err, list, collection){
		var lowestCount = -1
		var serverkey = null
		Object.keys(collection.servers || {}).forEach(function(key){
			var jobs = collection.servers[key]
			if(lowestCount<0 || jobs.length<lowestCount){
				lowestCount = jobs.length
				serverkey = key
			}
		})
		var server = collection.servers[serverkey]
		done(null, {
			hostname:server.hostname,
			docker:server.docker
		})
	})
}

module.exports = function(opts){
	return new Dowding(opts)
}