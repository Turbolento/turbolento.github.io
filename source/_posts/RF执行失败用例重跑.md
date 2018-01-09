---
title: RF执行失败用例重跑
comments: true
categories:
  - 自动化
tags:
  - Robot Framework
date: 2018-01-08 09:06:34
---
&emsp;&emsp;本文通过修改RF源代码，增加命令pybot参数--retry N,以实现执行过程中，test级别的用例失败后自动再执行N次，或直到成功为止，生成的日志和报告文件中只记录最后一次执行结果。  
<!-- more -->
**修改代码如下：**  
#### 1. robot/run.py ####
修改USAGE文档，增加 -Z --retry retry&emsp;&emsp;&emsp;&emsp;Set the retry times if test failed.  
>Options  
>=======  
><span style="background:yellow">-Z --retry retry&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;Set the retry times if test failed.</span>  
>-N --name name&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;Set the name of the top level test suite. Underscores  
>&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp; in the name are converted to spaces. Default name is  
>&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp; created from the name of the executed data source.  
>-D --doc documentation&emsp;&emsp;&emsp;&nbsp; Set the documentation of the top level test suite.  
>&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp; Underscores in the documentation are converted to  
>&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp; spaces and it may also contain simple HTML formatting  
>&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp; (e.g. *bold* and http://url/). 

增加导入模块  

	reload(sys)  
	sys.setdefaultencoding('UTF-8')
	from xml.dom import minidom

RobotFramework类增加make方法  

	def make(self,outxml):
        xmldoc = minidom.parse(outxml)
        suiteElementList = xmldoc.getElementsByTagName('suite')
        mySuite = []
        for suiteElement in suiteElementList:
            if suiteElement.childNodes is not None:
                for element in suiteElement.childNodes:
                    if element.nodeName == 'test':
                        mySuite.append(suiteElement)
                        break
        for suite in mySuite:
            testElements = {}
            for element in suite.childNodes:
                if element.nodeName == 'test':
                    name = element.getAttribute('name')
                    if testElements.get(name) == None:
                        testElements.update({name:[element]})
                    else:
                        testElements.get(name).append(element)
            for n,el in testElements.iteritems():
                for i in el[0:-1]:
                    textElement = i.nextSibling
                    suite.removeChild(i)
                    suite.removeChild(textElement)
        savefile = open(outxml,'w')
        root = xmldoc.documentElement
        root.writexml(savefile)
        savefile.close()

修改RobotFramework类的main方法，插入self.make(settings.output)这段

	def main(self, datasources, **options):
    	settings = RobotSettings(options)
    	LOGGER.register_console_logger(**settings.console_output_config)
    	LOGGER.info('Settings:\n%s' % unic(settings))
    	suite = TestSuiteBuilder(settings['SuiteNames'],
                             settings['WarnOnSkipped']).build(*datasources)
    	suite.configure(**settings.suite_config)
    	if settings.pre_run_modifiers:
        	suite.visit(ModelModifier(settings.pre_run_modifiers,
                                  settings.run_empty_suite, LOGGER))
    	with pyloggingconf.robot_handler_enabled(settings.log_level):
        	result = suite.run(settings)
        	LOGGER.info("Tests execution ended. Statistics:\n%s"
                    % result.suite.stat_message)
			self.make(settings.output)				#增加这一行,去掉此注释
        	if settings.log or settings.report or settings.xunit:
            	writer = ResultWriter(settings.output if settings.log
                                  else result)
            	writer.write_results(settings.get_rebot_settings())
    	return result.return_code

#### 2. robot/conf/settings.py ####
修改_cli_opts字典，增加 'Retry':('retry',1)  

	'MonitorColors'    		: ('monitorcolors', 'AUTO'),
	'StdOut'           		: ('stdout', None),
	'StdErr'           		: ('stderr', None),
	'XUnitSkipNonCritical'  : ('xunitskipnoncritical', False),
	'Retry'					: ('retry',1)}				#增加这一行,去掉此注释


#### 3. robot/model/itemlist.py ####
修改visit方法如下:  

	def visit(self, visitor):
        for item in self:
            if self.__module__ == 'robot.model.testcase' and hasattr(visitor,"_context"):
                testStatus = ''
                for i in range(0,int(visitor._settings._opts['Retry'])):
                    if testStatus != 'PASS':
                        if item.name in visitor._executed_tests:
                            visitor._executed_tests.pop(item.name)
                        item.visit(visitor)
                        testStatus = visitor._context.variables['${PREV_TEST_STATUS}']
                    else:
                        break
            else:
                item.visit(visitor)

#### 4. robotide\contrib\testrunner\usages.py ####
修改USAGE文档，增加 -Z --retry retry&emsp;&emsp;&emsp;&emsp;Set the retry times if test failed.这一段  
>Options  
>=======  
><span style="background:yellow">-Z --retry retry&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;Set the retry times if test failed.</span>  
>-N --name name&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;Set the name of the top level test suite. Underscores  
>&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp; in the name are converted to spaces. Default name is  
>&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp; created from the name of the executed data source.  
>-D --doc documentation&emsp;&emsp;&emsp;&nbsp; Set the documentation of the top level test suite.  
>&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp; Underscores in the documentation are converted to  
>&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp; spaces and it may also contain simple HTML formatting  
>&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp; (e.g. *bold* and http://url/). 

最后使用 ```pybot -Z 3 -t E:\autotest\test``` 即可实现失败重跑功能。