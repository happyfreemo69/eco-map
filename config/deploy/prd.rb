set :deploy_to, '/home/deployer/ecomap'
set :user, 'deployer'
set :branch, 'prd'

role :app, %w{deployer@94.177.233.14}
server '94.177.233.14', user: 'deployer', roles: %w{web}
