// PM2 yapılandırması: sunucuda `pm2 start ecosystem.config.cjs`
// NOT: instances 1 kalmalı. İstek sınırlama sayaçları
// süreç içinde tutuluyor.
module.exports = {
  apps: [
    {
      name: 'medipoldate',
      script: 'server/local.js',
      cwd: __dirname,
      node_args: '--env-file=.env',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      max_memory_restart: '400M',
      time: true,
      env: { NODE_ENV: 'production' },
    },
  ],
};
