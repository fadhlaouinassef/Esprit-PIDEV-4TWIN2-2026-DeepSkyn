const { PrismaClient } = require('@prisma/client')

module.exports = {
  datasource: {
    url: process.env.DATABASE_URL,
  },
}

exports.prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
})
