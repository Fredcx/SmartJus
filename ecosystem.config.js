module.exports = {
    apps: [
        {
            name: 'legal-system-backend',
            script: './dist/server.js',
            cwd: '/var/www/legal-system/backend',
            env: {
                NODE_ENV: 'production',
                PORT: 3002,
            },
            env_file: '.env'
        }
    ]
};
