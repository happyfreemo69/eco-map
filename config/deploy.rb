# config/deploy.rb
lock '3.4.0'
set :application, 'eco-map'
set :repo_url, 'git@github.com:happyfreemo69/eco-map.git'

set :branch, 'master'
set :scm, :git
set :format, :pretty
set :log_level, :debug
set :node_env, (fetch(:node_env) || fetch(:stage))

# Default value for default_env is {}
set :default_env, { node_env: fetch(:node_env) }
set :linked_files, %w{data.json}
set :keep_releases, 5
set :ssh_options, { :forward_agent => true, :port => 6543 }
namespace :deploy do

  desc 'select a tag via tag=vxxx or redeploy the running rev'
  task :select_tag do
    tag = ENV['tag']
    if !tag
      if fetch(:branch)=='dev'
        tag='dev'
      else
        on roles(:app) do
          within current_path do
            tag = capture(:cat, "REVISION").gsub(/\s+/,'')
          end
        end
      end
    end
    if !tag
      print 'provide a proper tag'
      exit 1
    end
    set :branch, tag
  end

  desc 'ensure server is correctly running'
  task :ping do
    on roles(:app), in: :sequence do
      within current_path do 
        execute :echo, 'pinging'
        execute :sleep, '4'
        system "curl -o /dev/null --max-time 10 --silent --head --write-out '%{http_code}' http://#{host} | grep -q 200"
        if($?.exitstatus != 0) then
          puts 'ping failed: ' + $?.exitstatus.to_s
          exit
        end
      end
    end
  end

  desc 'get deployed tag'
  task :version do
    on roles(:app), in: :sequence, wait: 5 do
      within current_path do 
        tag = capture(:cat, "REVISION").gsub(/\s+/,'')
        system "git show-ref|grep #{tag}"
      end
    end
  end
  after :started, 'deploy:select_tag'
end
