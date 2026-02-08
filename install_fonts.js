const { execSync } = require('child_process');

try {
    console.log('Installing fonts...');
    execSync('npm install --save @fontsource/amiri @fontsource/cairo @fontsource/crimson-text @fontsource/lato', { stdio: 'inherit', shell: true });
    console.log('Fonts installed successfully.');
} catch (error) {
    console.error('Failed to install fonts:', error);
    process.exit(1);
}
