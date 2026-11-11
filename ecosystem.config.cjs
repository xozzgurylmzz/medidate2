// PM2 yapılandırması: sunucuda `pm2 start ecosystem.config.cjs`
// NOT: instances 1 kalmalı. Çevrimiçi durumu, istek sınırlama ve canlı sohbet
// tek süreç içinde tutuluyor; birden fazla kopya çalıştırırsan sohbet bozulur.
module.exports = {
  apps: [
    {
      name: 'medipoldate',
      script: 'server/index.js',
      cwd: __dirname,
      node_args: '--disable-warning=ExperimentalWarning --env-file=.env',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      max_memory_restart: '400M',
      time: true,
      env: { NODE_ENV: 'production' },
    },
  ],
};
