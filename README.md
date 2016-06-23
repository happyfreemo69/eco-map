Use
sudo gem install capistrano -v 3.4.0
cap install
then 
create a tag (for instance v0.0.1)
git tag v0.0.1
git push --tags
cap prd deploy tag=v0.0.1