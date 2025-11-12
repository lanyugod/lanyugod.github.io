# Docker 的安装及初始化

## 1.安装可以访问的源

```bash
#!/bin/bash
mkdir /etc/yum.repos.d/bak
mv /etc/yum.repos.d/*.repo /etc/yum.repos.d/bak/
wget -O /etc/yum.repos.d/CentOS-Base.repo http://mirrors.aliyun.com/repo/Centos-8.repo
yum clean all
yum repolist
```

## 2.安装工具

```
yum install -y yum-utils
```

## 3.配置相关镜像源

```
yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
```

或者使用阿里云

```
yum-config-manager --add-repo https://mirrors.aliyun.com/docker-ce/linux/centos/docker-ce.repo
```



## 4.安装Docker

```
yum install -y docker-ce docker-ce-cli containerd.io
```

然后设置一下开机自启

```
systemctl enable docker
```

## 5.设置Docker 环境

设置拉取 Docker 代理源，更换 Docker 的根目录，设置 Docker 的日志最大范围

```shell
mkdir -p /etc/docker
tee /etc/docker/daemon.json <<EOF
{
    "data-root": "/data/docker",
    "log-level": "warn",
    "log-driver": "json-file",
    "log-opts":{
    "max-size":"100m",
    "max-file":"5"
    },
    "registry-mirrors": [
    "https://registry.docker-cn.com",
    "https://docker.registry.cyou",
    "https://docker-cf.registry.cyou",
    "https://dockercf.jsdelivr.fyi",
    "https://docker.jsdelivr.fyi",
    "https://dockertest.jsdelivr.fyi",
    "https://mirror.aliyuncs.com",
    "https://dockerproxy.com",
    "https://mirror.baidubce.com",
    "https://docker.m.daocloud.io",
    "https://docker.nju.edu.cn",
    "https://docker.mirrors.sjtug.sjtu.edu.cn",
    "https://docker.mirrors.ustc.edu.cn",
    "https://mirror.iscas.ac.cn",
    "https://docker.rainbond.cc",
    "http://hub-mirror.c.163.com",
    "https://docker.fxxk.dedyn.io",
    "https://huecker.io",
    "https://dockerhub.timeweb.cloud",
    "https://noohub.ru"
  ]
}
EOF

```

## 6.设置新的家目录

```
mkdir /data/docker

```

然后移动当前目录

```
rsync -av --progress /var/lib/docker/* /data/docker/
```

或者

```
mv /var/lib/docker/* /data/docker/
```

然后启动 Docker 即可

# 7.安装 docker-compose

```
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
# 赋予执行权限
sudo chmod +x /usr/local/bin/docker-compose
# 检查版本
docker-compose --version

```

如果提示没有命令：

```
export PATH=$PATH:/usr/local/bin
```

