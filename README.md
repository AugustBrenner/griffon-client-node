# Griffon Client

A NodeJS Client for Griffon workflows.

Griffon is a message queue for easily building workflows.  A griffon server acts a hub, connecting griffon clients.  Clients connect and kickoff tasks within a workflow, then relay the results when they are done.  Griffon tracks dependecies as clients connect, and provides a powerful architecture for developing against, debugging, and running complex workflows.


## Getting Started


### Prerequisites

Griffon clients require a running Griffon server, see installing and running a [Griffon Server](https://github.com/AugustBrenner/griffon-server-node). It's a snap to set up.

### Installing

```
npm install griffon-client
```

### Running

The following is a simple example of useage

```
const griffon = require('griffon-client')


const operator = await griffon.connect({
    uri: 'http://localhost:3001',
    environment: 'local',
    operator: 'test',
    produce: ['topic1', 'topic2'],
    consume: ['topic1', 'topic2'],
})

operator.consume('topic1', async task => {
    console.log(task)
    await task.produce({
        topic: 'topic2',
        data: 'World'
    })
})

operator.consume('topic2', async task => {
    console.log(task)
})


await operation.produce({
    topic: 'topic1',
    data: 'Hello'
})
```

The following is a complete example:

```
const griffon = require('griffon-client')


const operator = await griffon.connect({
    uri: 'http://localhost:3001',
    username: 'admin',
    password: 'password',
    environment: 'local',
    operator: 'test1',
    channels: ['.*'],
    consume: {and: ['topic1', 'topic2']},
    produce: ['topic3', 'topic4'],
})

operator.consume(async operation => {

    console.log(operation)

    const output = operation.data.topic1.toUpperCase() + operation.data.topic2.toLowerCase()

    console.log(output)

    await operation.produce({
        topic: 'topic3',
        data: output + 3
    })

    await operation.produce({
        topic: 'topic4',
        data: output + 4
    })
})


setTimeout(async () => {

    const operator = await griffon.connect({
        uri: 'http://localhost:3001',
        username: 'admin',
        password: 'password',
        environment: 'local2',
        consume: {and: ['topic1', 'topic2']},
        channels: ['dev'],
        operator: 'test1',
        produce: ['topic3', 'topic4'],
    })

    operator.consume(async operation => {

        console.log(operation)

        const output = operation.data.topic1.toUpperCase() + operation.data.topic2.toLowerCase()

        console.log(output)

        await operation.produce({
            topic: 'topic3',
            data: output + 3
        })

        await operation.produce({
            topic: 'topic4',
            data: output + 4
        })
    })

}, 2000)
```
