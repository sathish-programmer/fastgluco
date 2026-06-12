module.exports = {
  apps: [
    {
      name: 'fastgluco-backend',
      script: './dist/server.js',
      instances: 'max', // Utilizes all CPU cores for clustering
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env_production: {
        NODE_ENV: 'production',
        PORT: 5001,
        MONGODB_URI: 'mongodb+srv://user:pass@cluster.mongodb.net/fastgluco?retryWrites=true&w=majority'
      }
    }
  ]
};
