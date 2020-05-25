'use strict'

/************************************************************************
 * Environment variable validations
 ***********************************************************************/


/************************************************************************
 * External Dependencies
 ***********************************************************************/

// Node Modules ========================================================
const io 			= require('socket.io-client')

// Data Models =========================================================

// Local Dependencies ===============================================

// Module Settings =====================================================




/************************************************************************
 * Private Functions
 ***********************************************************************/

const normalizeConsumer = consumer => {

	if(!consumer){
		return {or: []}
	}

	else if(typeof consumer === 'string'){

		return {or: [consumer]}
	}

	else if(Array.isArray(consumer)){

		return {or: consumer}
	}

	else return consumer
}

const normalizeArray = producer => {

	if(!producer) return []

	else if(!Array.isArray(producer)) return [producer]

	return producer
}


/************************************************************************
 * Public Functions
 ***********************************************************************/

const client = () => {

	const pack = {
		args: {
			channels: ['default'],
			environment: 'default',
		}
	}

	const funcs = ['task', 'operator', 'channels', 'produce', 'username', 'password', 'token']

	funcs.forEach(key => {
		pack[key] = arg => {
			pack.args[key] = arg
			return pack
		}
	})

	pack.consume = (consumer, args) => {

		consumer = normalizeArray(consumer)

		const config = {}

		config[args.gather ? 'and' : 'or'] = consumer

		pack.args.consume = config

		return pack
	}

	pack.connect = uri => new Promise((resolve, reject) => {

		console.log(`connecting to server at ${uri}`)

		const init = {
			username: pack.args.username,
			password: pack.args.password,
			operator: pack.args.task,
			environment: pack.args.environment,
			consume: normalizeConsumer(pack.args.consume),
			produce: normalizeArray(pack.args.produce),
			channels: normalizeArray(pack.args.channels),
		}

		var socket = io.connect(uri, {
			query: {
				init:JSON.stringify(init)
			}
		})


		const consumers = {}

		let gatherer

		socket.on('connect', response => {
		
			console.log('Successfully connected.')

			resolve({

				consume: (topics, func) => {
					if(typeof topics === 'function'){
						func = topics
						topics = ['*']
					}

					topics = normalizeArray(topics)

					topics.forEach(topic => {
						if(consumers[topic] || consumers['*']) throw Error(`Consumer for topic '${topic}' has already been registered.`)
						consumers[topic] = func
					})
				},

				gather: func => {
					if(Object.keys(consumers).length > 0) throw Error('Gather listens for all topics and can not be used with consume.')
					gatherer = func
				},

				produce: (topic, data, channel) => {
					console.log(pack.args.channels)

					if(!channel && pack.args.channels.length === 1 && pack.args.channels[0] === 'default'){
						channel = 'default'
					}

					if(!topic) throw new Error('Producers must include a topic.')
					if(!data) throw new Error(`Key, 'data', must not be empty.`)
					if(!channel) throw new Error('Raw production must include a channel.')

					console.log('producing: ', topic)

					socket.emit('production', {topic: topic, channel: channel, data:data})
				}
			})
		})

		socket.on('consumption', payload => {

			console.log(payload)

			const produce = (topic, params) => {

				if(!topic) throw new Error('Producers must include a topic.')
				if(!data) throw new Error(`Key, 'data', must not be empty.`)
				
				const production_payload = {
					topic: topic,
					data: data,
					stream_id: payload.stream_id,
					channel: payload.channel,
				}

				socket.emit('production', production_payload)
			}



			if(gatherer){
				return gatherer({
					produce: produce,
					payload: payload,
					topics: payload.topics,
					data: payload.data,
				})
			}

			payload.topics.forEach(topic => {

				const consumer = consumers[topic] || consumers['*']
				
				if(consumer){
					consumer({
						produce: produce,
						payload: payload,
						topic: topic,
						data: payload.data[topic],
					})
				}
			})

		})

		socket.on('error', console.error)

		socket.on('info', console.log)
	})

	return pack
}







/************************************************************************
 * Public Export
 ***********************************************************************/

module.exports = client
