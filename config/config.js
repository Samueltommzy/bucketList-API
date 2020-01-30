let user = process.env.user;
let password = process.env.password;
module.exports = {
    dbUrl: 'mongodb://127.0.0.1:27017/BucketList-API',
    dbName: 'BucketList-API',
    JWT_SECRET: 'BucketList',
    prodDb:`mongodb://${user}:${password}@ds315359.mlab.com:15359/bucketlist`
}