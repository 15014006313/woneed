const Sequelize = require('sequelize');
const config = require('./conf');
var sequelize = new Sequelize(config.database, config.username, config.password, {
    host: config.host,
    dialect: 'mysql',
    pool: {
        max: 5,
        min: 0,
        idle: 30000
    },
    define: {
        freezeTableName: true,//禁止自动修改表名
        timestamps: false,//不需要添加 createdAt 和 updatedAt 两个时间戳字段
    }
});
module.exports = {
    sequelize,
    Sequelize
};