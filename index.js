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

const Public = {}


Public.connect = args => new Promise((resolve, reject) => {

	console.log(`connecting to server at ${args.uri}`)

	const init = {
		username: args.username,
		password: args.password,
		operator: args.operator,
		environment: args.environment,
		consume: normalizeConsumer(args.consume),
		produce: normalizeArray(args.produce),
		channels: normalizeArray(args.channels),
	}

	var socket = io.connect(args.uri, {
		query: {
			init:JSON.stringify(init)
		}
	})


	const listeners = []

	socket.on('connect', response => {
	
		console.log('Successfully connected.')

		resolve({

			consume: func => {
				listeners.push(func)
			},

			produce: params => {

				if(!params.topic) throw new Error('Producers must include a topic.')
				if(!params.channel) throw new Error('Raw production must include a channel.')
				if(!params.data) throw new Error(`Key, 'data', must not be empty.`)

				console.log('producing: ', params.topic)

				socket.emit('production', params)
			}
		})
	})

	socket.on('consumption', payload => {
		listener({
			produce: params => {

				if(!params.topic) throw new Error('Producers must include a topic.')
				if(!params.data) throw new Error(`Key, 'data', must not be empty.`)
				
				const production_payload = {
					topic: params.topic,
					stream_id: payload.stream_id,
					channel: payload.channel,
					data: params.data,
				}

				socket.emit('production', production_payload)
			},
			payload: payload,
			topics: payload.topics,
			data: payload.data,
		})
	})

	socket.on('error', console.error)

	socket.on('info', console.log)
})





/************************************************************************
 * Public Export
 ***********************************************************************/

module.exports = Public
