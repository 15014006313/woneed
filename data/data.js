const fs = require('fs');
let files = fs.readdirSync(__dirname + '/models');

let js_files = files.filter(f => f.endsWith('.js'), files);

let data = {};

for (let f of js_files) {
    let name = f.substring(0, f.length - 3);
    data[name] = require(__dirname + '/models/' + f);
}

module.exports = {
    sync: () => {
        if (process.env.NODE_ENV !== 'production') {
            sequelize.sync({ force: true });
        } else {
            throw new Error('Cannot sync() when NODE_ENV is set to \'production\'.');
        }
    },
    data: data
};
