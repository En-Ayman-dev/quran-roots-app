const { executeQuery } = require('./src/config/database');

async function checkIndexes() {
    try {
        const result = await executeQuery("SELECT name, tbl_name, sql FROM sqlite_master WHERE type='index' AND tbl_name='token'");
        console.log(JSON.stringify(result, null, 2));
    } catch (err) {
        console.error(err);
    }
}

checkIndexes();
