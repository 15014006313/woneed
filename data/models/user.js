const conn = require('../connect/connect');
const sequelize = conn.sequelize;
const Sequelize = conn.Sequelize;

module.exports = sequelize.define("user", {
    rowid: {
        type: Sequelize.INTEGER,
        primaryKey: true
    },
    username: Sequelize.STRING(100),
    age: Sequelize.STRING(100),
    job: Sequelize.STRING(100),
    create_time: Sequelize.DATE,
    userid: Sequelize.STRING(100)
}, {
    timestamps: false
});