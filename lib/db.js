'use strict'

const configDb = require('../config/db')
let config = configDb[configDb.preferred]

module.exports = () => {
  return {
    connect: () => {
      mongoose.connect(`mongodb://${config.user}:${config.password}@${config.host}/${config.db}`,
      { useMongoClient: true, promiseLibrary: global.Promise })
    }
  }
}
