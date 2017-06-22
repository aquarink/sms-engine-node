Env
1. Node version             =   node -v     =   v6.10.3
2. NPM version              =   npm -v      =   v3.10.10
3. Mongodb version          =   mongo       =   v2.6.12

Resouce SMS Engine  
1.

Install
#Mongodb on Linux Centos 6
1. Add the MongoDB Repository  : vi /etc/yum.repos.d/mongodb.repo
2. Insert this code
64x
[mongodb]
name=MongoDB Repository
baseurl=http://downloads-distro.mongodb.org/repo/redhat/os/x86_64/
gpgcheck=0
enabled=1

32x
[mongodb]
name=MongoDB Repository
baseurl=http://downloads-distro.mongodb.org/repo/redhat/os/i686/
gpgcheck=0
enabled=1

3. Install Depedencies : yum install mongo-10gen mongo-10gen-server

# Fix a MongoDB Error : a
** WARNING: soft rlimits too low. rlimits set to 4096 processes, 64000 files. Number of processes should be at least 32000...
1. vi /etc/security/limits.conf
2. Add this code
mongod soft nproc 64000
mongod hard nproc 64000
mongod soft nofile 64000
mongod hard nofile 64000

3. Restart Mongo Service : service mongod restart

# Create User Mongodb
1. In terminal type : mongo
2. Type "use <db name>" : use admin
3. Type config : 
db.createUser(
  {
    user: "admin",
    pwd: "admin123",
    roles: [ { role: "userAdminAnyDatabase", db: "admin" } ]
  }
)
4. More on : https://www.howtoforge.com/tutorial/how-to-install-and-configure-mongodb-on-centos-7/

# Ulimit 
1. cat /etc/security/limits.d/ANGKA-nproc.conf
2. vi cat nya
3. Edit code : 

*          soft    nproc     4096 <<
root       soft    nproc     unlimited

4. More on : https://serverfault.com/questions/591812/how-to-set-ulimits-for-mongod/624107

Config
1. Runing Mongodb on Windows
   D:\MongoDB\Server\3.4\bin\mongod.exe --config D:/MongoDB/Server/3.4/mongo.config


2. Runing Mongodb on Linux/Unix
   service mongod start/stop/restart


Port Config
1. sudo iptables -I INPUT -p tcp --dport 3000 -j ACCEPT << if port 3000
2. service iptables restart
3. service ip6tables restart