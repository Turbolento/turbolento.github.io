---
title: RF关联案例设置方法
comments: true
categories:
  - 自动化
tags:
  - Robot Framework
date: 2018-01-08 10:28:40
---
&emsp;&emsp;虽然手工测试用例的编写规则一般建议，用例之间要尽量避免关联性，测试点要尽量独立，但如果在自动化领域，考虑到自动化的执行效率，以及自动化数据流之间的关联性，这种建议往往比较难以实现。比如说，测试一个用户登录之后的某些功能，必须要先在环境中注册好一个用户，在自动化中可实现的方法有两种：  
&emsp;&emsp;1. 将已注册的用户设置成全局变量放入到配置文件中，每次新环境执行自动化用例前，手工生成一个已注册用户，再将该用户信息写入配置文件中去；  
&emsp;&emsp;2. 单独写一条自动化用例实现注册功能，其它测试用例基于该注册用例产生的注册用户进一步执行；  
&emsp;&emsp;方法1执行自动化前需要手工去准备数据，这里只列举出了一种场景，假如测试场景中有更多前置条件需要设置，则需要手工生成的数据也会很多，这种方法无疑是效率很低的一种半自动化；方法2也存在一种问题，在手工测试，如果测试人员要测试更多的已登录功能，一般都会先将注册更能调试通，能注册成功之后再会去测试其它功能，假如注册都失败了，后面的用例也不需要再执行了；但在自动化执行过程中，注册失败了，还是会继续执行后续用例，这将会导致自动化执行效率很低。  
&emsp;&emsp;本文就是基于robot framework自动化，模拟手工测试过程解决方法2中存在的问题。  

**1. 重复执行单条用例N次，直到成功**
>参照上一篇文章 [RF执行失败用例重跑](https://turbolento.github.io/2018/01/08/RF%E6%89%A7%E8%A1%8C%E5%A4%B1%E8%B4%A5%E7%94%A8%E4%BE%8B%E9%87%8D%E8%B7%91/)  

**2. 如果前置用例失败，则关联性用例直接标记失败**  
2.1 自定义关键字  

|<span style="color:#42E205">关联案例集_案例初始化</span> | | | | |   
|:---|:---|:---|:---|:---|  
|<span style="color:blue">初始化环境</span>|||||  
|<span style="color:blue">Run Keyword If</span>|'clearSuiteStatus' in @{TEST_TAGS}|<span style="color:blue">Set Suite Variable</span>|${suite_status}|RUN|  
|<span style="color:blue">Run Keyword If</span>|'${suite_status}' == 'INTERRUPT'|<span style="color:blue">Fail</span>|前置条件设置失败！|&nbsp;|  

|<span style="color:#42E205">关联案例集_案例集初始化</span> | | | |   
|:---|:---|:---|:---|  
|<span style="color:blue">Set Suite Variable</span>|${suite_status}|RUN|#RUN/INTERRUPT|  

|<span style="color:#42E205">关联案例集_案例析构</span> | | | | |   
|:---|:---|:---|:---|:---|  
|<span style="color:blue">Run Keyword If</span>|'suite_init' in @{TEST_TAGS} and '${TEST_STATUS}' == 'FAIL'|<span style="color:blue">Set Suite Variable</span>|${suite_status}|INTERRUPT|  
|<span style="color:blue">释放环境</span>||||||  

2.2 管理关联用例名称  
&emsp;&emsp;采用尾部加上-[大小写字母]的方式：大写字母表示前置用例，对应的小写字母表示想关联的用例，如下图：
![imgName](/upload/rf_1.png)

2.3 管理用例标签  

- -[A]不依赖任何用例，只被其它用例依赖，则添加标签`suite_init`、`clearSuiteStatus`
- -[a]只依赖其它用例，不被其它用例依赖，则不添加标签
- -[a][B]依赖其它标签，也被其它标签依赖，则只添加标签`suite_init`

2.4 设置suite前置条件  
![imgName](/upload/rf_2.png)

执行命令`pybot -Z 3 -t * E:\auto\00正常流程用例` 即可。