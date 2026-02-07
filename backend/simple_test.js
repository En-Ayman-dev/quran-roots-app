
const fs = require('fs');
console.log("Hello from simple test");
try {
    fs.writeFileSync('simple_test.txt', 'Hello World');
    console.log("File written");
} catch (e) {
    console.error(e);
}
