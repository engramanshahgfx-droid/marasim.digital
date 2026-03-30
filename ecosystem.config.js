module.exports = {
  apps: [
    {
      name: 'e-invitation',
      script: 'node_modules/.bin/next',
      args: 'start -p 3000',
      cwd: '/var/www/e-invitation',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      autorestart: true,
      max_restarts: 10,
      env: {
        NODE_ENV: 'production',
      },
      env_file: '.env.production',
    },
  ],
}
