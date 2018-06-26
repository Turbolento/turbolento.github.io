---
title: python使用微服务之consul
comments: true
categories:
  - python 
  - consul
tags:
  - python
  - consul
date: 2018-06-25 20:04:24
---

>安装python-consul模块：`pip install python-consul`  

#### 1. 注册服务 ####
&emsp;&emsp;使用`/v1/agent/service/register`这个HTTP APi来进行注册，注册的目标consul主机，可以是server，也可以是client，端口是8500。如果非本地主机注册，则需要目标主机启动consul时加上`-client 目标访问ip`，否则无法远程访问。 代码如下：  

	#coding=utf-8
	import urllib2,json
	
	register_url = "http://%s:8500/v1/agent/service/register"%"localhost"
	register_data = {
						"id": "serviceID",				#服务ID，每个datacenter中唯一
						"name": "serviceName",			#服务名称，服务表示
						"address": "10.x.x.x",			#服务提供者的IP
						"port": 8080,					#服务提供者的端口
						"tags": ["dev"],
						"checks": [{"http": "http://localhost:8080/check","interval": "5s"}]
					}
	request = urllib2.Request(register_url,data=json.dumps(register_data))
	request.add_header('Content-Type', 'application/json')
	request.get_method = lambda: 'PUT'
	urllib2.urlopen(request)

#### 2. 删除服务 ####
&emsp;&emsp;使用`/v1/agent/service/deregister/[serviceID]`这个HTTP API来删除服务。删除和注册必须要在同一台consul主机上进行，不能通过A主机注册，又通过B主机删除。但发起注册和发起删除服务的主机可以不同。代码如下：

	# coding=utf-8
	import urllib2

	deregister_service_url = 'http://%s:8500/v1/agent/service/deregister/serviceID'%"localhost"
	request = urllib2.Request(deregister_service_url)
	request.add_header('Content-Type', 'application/json')
	request.get_method = lambda: 'PUT'
	urllib2.urlopen(request)

#### 3.获取Consul服务列表  ####
&emsp;&emsp;consul中没有注册中心的概念，一般是通过consul client进行服务注册和服务发现，这台用来服务注册和服务发现的主机就是一个Agent,生成一个Agent的代码为`agent = consul.Consul(host='172.30.1.71', port="8500")`。列出某个agent上可供访问到的所有服务(即当前agent所在datacenter中的所有服务)的代码如下：

	# coding=utf-8
	from consul import Consul

	def getAllService(agent):   #agent = Consul(host='172.30.1.71', port="8500")
	    newestIndex,services = agent.catalog.services()            #('23452', {u'test': [u'dev'], u'consul': [], u'mockPlatform': []})       ==>{'服务名1'：[tag1,tag2,...],...}
	    servicesList = services.keys()
	    servicesList.remove('consul')           #排除掉名称为'consul'的服务,为server端自带服务
	    return servicesList

#### 4. 获取服务 ####
&emsp;&emsp;查找指定服务的服务提供者，并返回访问速度最快的主机。代码如下：

	# coding=utf-8
	from consul import Consul
	import re,requests
	
	def getConnectTime(url):
	    return requests.head(url).elapsed.total_seconds()
	
	def getService(agent,name):  # 负载均衡获取服务实例agent = Consul(host='172.30.1.71', port="8500")
	    newestIndex, nodeList = agent.catalog.service(name)
	    if not nodeList:
	        raise Exception('There is no service: [%s] can be used!'%name)
	    dcset = set()  # DataCenter 集合 初始化
	    for service in nodeList:
	        dcset.add(service.get('Datacenter'))
	    serviceList = []  # 服务列表 初始化
	    for dc in dcset:
	        newestIndex,healthNodeList =agent.health.service(name,dc=dc,passing=True)
	        for serv in healthNodeList:
	            node = serv.get('Node').get("Node")
	            healthNodeList = agent.health.checks(name)[1]
	            for i in healthNodeList:
	                if i.get('Node')!= node:
	                    continue
	                else:
	                    health_output = i.get('Output')
	                    health = re.search(r'HTTP GET (http:.*): 2.*',health_output).group(1)
	            address = serv.get('Service').get('Address')
	            port = serv.get('Service').get('Port')
	            serviceList.append({'address': address,'port': port,'health':health})
	    if len(serviceList) == 0:
	        raise Exception('no serveice can be used')
	    else:
	        ret = ()
	        fastest = None
	        for s in serviceList:
	            health = s.get('health')
	            http_conn_time = getConnectTime(health)
	            if not fastest:
	                fastest = http_conn_time
	                ret = (s['address'], int(s['port']))
	            else:
	                if http_conn_time<fastest:
	                    ret = (s['address'], int(s['port']))
	        return ret

#### 5.consul提供的所有HTTP API ####
&emsp;&emsp;所有的endpoints主要分为以下类别：  
&emsp;&emsp;&emsp;&emsp;**kv** - Key/Value存储  
&emsp;&emsp;&emsp;&emsp;**agent** - Agent控制  
&emsp;&emsp;&emsp;&emsp;**catalog** - 管理nodes和services  
&emsp;&emsp;&emsp;&emsp;**health** - 管理健康监测  
&emsp;&emsp;&emsp;&emsp;**session** - Session操作  
&emsp;&emsp;&emsp;&emsp;**acl** - ACL创建和管理event - 用户Events  
&emsp;&emsp;&emsp;&emsp;**status** - Consul系统状态  

	agent endpoints：  (agent endpoints用来和本地agent进行交互，一般用来服务注册和检查注册，支持以下接口)
	    /v1/agent/checks :                          返回本地agent注册的所有检查(包括配置文件和HTTP接口)
	    /v1/agent/services :                        返回【本地agent注册】的所有 服务。注意！！只能是本地注册的服务
	    /v1/agent/members :                         返回agent在集群的gossip pool中看到的成员
	    /v1/agent/self :                            返回本地agent的配置和成员信息
	    /v1/agent/join/<address> :                  触发本地agent加入node
	    /v1/agent/force-leave/<node>:               强制删除node
	    /v1/agent/check/register :                  在本地agent增加一个检查项，使用PUT方法传输一个json格式的数据
	    /v1/agent/check/deregister/<checkID> :      注销一个本地agent的检查项
	    /v1/agent/check/pass/<checkID> :            设置一个本地检查项的状态为passing
	    /v1/agent/check/warn/<checkID> :            设置一个本地检查项的状态为warning
	    /v1/agent/check/fail/<checkID> :            设置一个本地检查项的状态为critical
	    /v1/agent/service/register :                在本地agent增加一个新的服务项，使用PUT方法传输一个json格式的数据
	    /v1/agent/service/deregister/<serviceID> :  注销一个本地agent的服务项,用PUT请求Consul 的这个deregister接口，附上服务id就可以成功注销掉服务了（注意是服务实例的id，不是服务名
	
	catalog endpoints：  (catalog endpoints用来注册/注销nodes、services、checks)
	    /v1/catalog/register :          			Registers a new node, service, or check
	    /v1/catalog/deregister :        			Deregisters a node, service, or check
	    /v1/catalog/datacenters :       			Lists known datacenters
	    /v1/catalog/nodes :             			Lists nodes in a given DC
	    /v1/catalog/services :          			Lists services in a given DC
	    /v1/catalog/service/<service> : 			Lists the nodes in a given service
	    /v1/catalog/node/<node> :       			Lists the services provided by a node
	
	health endpoints：	 (health endpoints用来查询健康状况相关信息，该功能从catalog中单独分离出来)
	    /v1/healt/node/<node>: 						返回node所定义的检查，可用参数dc=
	    /v1/health/checks/<service>: 				返回和服务相关联的检查，可用参数dc=
	    /v1/health/service/<service>: 				返回给定datacenter中给定node中service
	    /v1/health/state/<state>: 					返回给定datacenter中指定状态的服务，state可以是"any", "unknown", "passing", "warning", or "critical"，可用参数dc=
	
	session endpoints：	 (session endpoints用来create、update、destory、query sessions)
	    /v1/session/create:                 	Creates a new session
	    /v1/session/destroy/<session>:      	Destroys a given session
	    /v1/session/info/<session>:         	Queries a given session
	    /v1/session/node/<node>:            	Lists sessions belonging to a node
	    /v1/session/list:                   	Lists all the active sessions
	
	acl endpoints：		(acl endpoints用来create、update、destory、query acl)
	    /v1/acl/create:                     	Creates a new token with policy
	    /v1/acl/update:                     	Update the policy of a token
	    /v1/acl/destroy/<id>:               	Destroys a given token
	    /v1/acl/info/<id>:                  	Queries the policy of a given token
	    /v1/acl/clone/<id>:                 	Creates a new token by cloning an existing token
	    /v1/acl/list:                       	Lists all the active tokens
	
	status endpoints：	(status endpoints用来或者consul 集群的信息)
	    /v1/status/leader : 					返回当前集群的Raft leader
	    /v1/status/peers : 						返回当前集群中同事  


