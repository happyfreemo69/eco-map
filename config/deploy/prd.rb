set :deploy_to, '/home/deployer/ecomap'
set :user, 'deployer'
set :branch, 'prd'

role :app, %w{deployer@146.148.20.86}  
server '146.148.20.86', user: 'deployer', roles: %w{web} 
