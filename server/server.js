const http    = require('http')
const app     = require('./app')
const { init: initSocket } = require('./config/socket')
const { startCron } = require('./utils/cron')
require('dotenv').config()
require('./config/db')()

const PORT   = process.env.PORT || 5000
const server = http.createServer(app)

initSocket(server)
startCron()

server.listen(PORT, () => {
  console.log(`🚀 Cintu-Mintu Gang server running on port ${PORT}`)
})
