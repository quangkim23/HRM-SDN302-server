const { default: mongoose } = require("mongoose")

const connections = () => {
    const numberOfConnect = mongoose.connections.length;

    console.log(`Number of connect: ${numberOfConnect}`)
}

module.exports = connections