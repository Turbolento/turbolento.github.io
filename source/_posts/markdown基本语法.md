---
title: markdown基本语法
comments: true
date: 2018-01-05 15:30:13
categories:
- markdown
tags: 
- markdown
---
&emsp;&emsp;Markdown是一种可以使用普通文本编辑器编写的标记语言，通过简单的标记语法，它可以使普通文本内容具有一定的格式。  
&emsp;&emsp;Markdown的语法简洁明了、学习容易，而且功能比纯文本更强，因此有很多人用它写博客。世界上最流行的博客平台WordPress和大型CMS如Joomla、Drupal都能很好的支持Markdown。完全采用Markdown编辑器的博客平台有Ghost和Typecho。
> 软件：MarkdownPad  

### 1.1 标题 ###

&emsp;&emsp;(1) 1级到6级标题，快捷键<kbd>Ctrl + i</kbd>  (i=1~6)，等效为 <span style="color:green">>#..# 内容 #..#</span> 【注：#..#表示i个#号】

&emsp;&emsp;(2) #与文字之间加上空格，是markdown标准语法规则

&emsp;&emsp;(3) 在任意文字下一行加上任意个 = ，表示一级标题; 加 - 表示二级标题

### 1.1 字体格式 ###
&emsp;&emsp;（1）加粗快捷键 <kbd>Ctrl + B</kbd>, 等效为 <span style="color:green">\*\***粗体文本**\*\*</span>

&emsp;&emsp;（2）斜体快捷键 <kbd>Ctrl + I</kbd>, 等效为 <span style="color:green">\**斜体文本*\*</span>

&emsp;&emsp;（3）删除线： <span style="color:green"> \~\~~~删除我~~\~\~ </span>
### 1.2 分割线 ###
&emsp;&emsp;快捷键 <kbd>Ctrl + R</kbd>,等效为 <span style="color:green">\-\-\-,或者 \*\*\*</span>  
***
### 1.3 换行 ###
&emsp;&emsp;行末尾加上两个空格再回车
### 1.4 脚注 ###
&emsp;&emsp;这是一个脚注的例子[^1]

[^1]: 这里是脚注
	这是一个脚注的例子[^1]

	[^1]: 这里是脚注


----------

----------

### 2.1 引用 ###
&emsp;&emsp;快捷键 <kbd>Ctrl + Q</kbd>,等效为 <span style="color:green">> 内容</span>

&emsp;&emsp;&emsp;<i>(注：多级引用可以使用多个>>)</i>
>一级    >
>>二级   >>
>>>三级  >>>

### 2.2 插入图片 ###
&emsp;&emsp;快捷键 <kbd>Ctrl + G</kbd>,等效为 <span style="color:green">!\[imgName\]\(url\)</span>
![imgName](/upload/markdown_1.png)
### 2.3 插入链接 ###
&emsp;&emsp;语法为：<span style="color:green">\[链接名称\](url)</span>

&emsp;&emsp;[百度一下](https://www.baidu.com)

### 2.4 序列 ###
&emsp;&emsp;（1）**无序序列** 快捷键 <kbd>Ctrl + U</kbd>	等效于 <span style="color:green">- 内容</span> 或者 <span style="color:green">+ 内容</span> 或者 <span style="color:green">* 内容</span>

&emsp;&emsp;（2）**有序序列** 快捷键 <kbd>Ctrl + Shift + O</kbd>	等效于 <span style="color:green">1. 列表</span>
### 2.5 代码引用 ###
&emsp;&emsp;代码块：快捷键 <kbd>Ctrl + K</kbd>,等效为 <span style="color:green">4个以上的空格开头</span> 或者 <span style="color:green"> 3个反引号``` </span>

&emsp;&emsp;可嵌入代码行：快捷键 <kbd>Ctrl + K</kbd>, <span style="color:green"> \`代码\` </span>

----------

----------

### 3.1 表格 ###

	|标题|标题|标题|
	|:---|:---:|---:|
	|居左测试文本|居中测试文本|居右测试文本|
	|居左测试文本1|居中测试文本2|居右测试文本3|
	|居左测试文本11|居中测试文本22|居右测试文本33|
	|居左测试文本111|居中测试文本222|居右测试文本333|

|标题|标题|标题|
|:---|:---:|---:|  
|居左测试文本|居中测试文本|居右测试文本|  
|居左测试文本1|居中测试文本2|居右测试文本3|  
|居左测试文本11|居中测试文本22|居右测试文本33|  
|居左测试文本111|居中测试文本222|居右测试文本333|  