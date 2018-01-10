---
title: python多进程编程
comments: true
categories:
  - python
tags:
  - python
  - multiprocessing
date: 2018-01-10 09:24:47
---
&emsp;&emsp;Python由于全局锁GIL的存在，无法享受多线程带来的性能提升。multiprocessing包采用子进程的技术避开了GIL，使用multiprocessing可以进行多进程编程提高程序效率。  
## multiprocessing.Process对象 ##
    from multiprocessing import Process

	#定义子进程处理函数
	def worker(a,b,c=3,d=6):
    	pass
	
	p = Process(target=worker,name='run_worker',args=(1,2),kwargs={d:'4'})
	p.daemon = True		#设置子进程是否随父进程终止而自动终止，一定要在start方法调用之前设置
	p.start()
	p.join()
&emsp;&emsp;Process对象的初始化参数为<span style="background:lightgrey">Process(group=None, target=None, name=None, args=(), kwargs={})</span>，其中group参数必须为None（为了与threading.Thread的兼容），target指向可调用对象（该对象在新的子进程中运行），name是为该子进程命的名字（默认是Proess-1,Process-2, …这样），args是被调用对象的位置参数的元组列表，kwargs是被调用对象的关键字参数。

&emsp;&emsp;子进程终结时会通知父进程并清空自己所占据的内存，在内核里留下退出信息(exit code，如果顺利运行，为0；如果有错误或异常状况，为大于零的整数)。父进程得知子进程终结后，需要对子进程使用wait系统调用，wait函数会从内核中取出子进程的退出信息，并清空该信息在内核中占据的空间。

&emsp;&emsp;如果父进程早于子进程终结，子进程变成孤儿进程，孤儿进程会被过继给init进程，init进程就成了该子进程的父进程，由init进程负责该子进程终结时调用wait函数。如果父进程不对子进程调用wait函数，子进程成为僵尸进程。僵尸进程积累时，会消耗大量内存空间。 可以设置子进程的daemon属性为True,则父进程终结时，自动终止该子进程。

&emsp;&emsp;如果在父进程中不调用子进程的`p.join（）`方法，则主进程与父进程并行工作。join方法的作用主要是(以下线程均可换为子进程)：  
* 阻塞主进程（挡住，无法执行join以后的语句），专注执行多线程。  
* 多线程多join的情况下，依次执行各线程的join方法，前头一个结束了才能执行后面一个。  
* 无参数时，则等待到该线程结束，才开始执行下一个线程的join。  
* 设置参数后，则等待该线程这么长时间如果没有执行完就阻塞该线程。  
>### 将进程定义为类 ###
		import multiprocessing
		import time
		class ClockProcess(multiprocessing.Process):
		    def __init__(self, interval):
		        multiprocessing.Process.__init__(self)
		        self.interval = interval
		    def run(self):
		        n = 5
		        while n > 0:
		            print("the time is {0}".format(time.ctime()))
		            time.sleep(self.interval)
		            n -= 1
			if __name__ == '__main__':
		    	p = ClockProcess(3)
		    	p.start()


## multiprocessing.Queue对象 ##
使用Queue对象可以实现进程间通信，并且Queue对象是线程及进程安全的：

    from multiprocessing import Queue, Process
	def worker(q):
	    q.put(['abc',123,'x'])

	if __name__ == "__main__":
    	q = Queue()
    	p = Process(target = worker,args=(q,))
    	p.daemon = True
    	p.start()
    	p.join()
    	print q.get()


## multiprocessing.Pipe对象 ##
Pipe对象返回的元组分别代表管道的两端p[0]和p[1]，管道默认是全双工，两端都支持send和recv方法，两个进程分别操作管道两端时不会有冲突，两个进程对管道一端同时读写时可能会有冲突：

	from multiprocessing import Pipe, Process
	def worker(p):
	    p.send('hello,world!')
	
	if __name__ == "__main__":
	    left,right = Pipe()
	    p = Process(target=worker,args=(left,))
	    p.daemon = True
	    p.start()
	    p.join()
	    print right.recv()
如果声明了p = Pipe(duplex=False)的单向管道，则p[0]只负责接受消息，p[1]只负责发送消息。  

## multiprocessing.Lock对象 ##
当多个进程需要访问共享资源的时候，Lock可以用来避免访问的冲突。  
Lock有两种方法使用：1.使用with上下文管理器;2.使用acquire()和release()方法  

	import multiprocessing
	import sys
	
	def worker_with(lock, f):
	    with lock:
	        fs = open(f, 'a+')
	        n = 10
	        while n > 1:
	            fs.write("Lockd acquired via with\n")
	            n -= 1
	        fs.close()
	        
	def worker_no_with(lock, f):
	    lock.acquire()
	    try:
	        fs = open(f, 'a+')
	        n = 10
	        while n > 1:
	            fs.write("Lock acquired directly\n")
	            n -= 1
	        fs.close()
	    finally:
	        lock.release()
	    
	if __name__ == "__main__":
	    lock = multiprocessing.Lock()
	    f = "file.txt"
	    w = multiprocessing.Process(target = worker_with, args=(lock, f))
	    nw = multiprocessing.Process(target = worker_no_with, args=(lock, f))
	    w.start()
	    nw.start()
	    print "end"

## multiprocessing.Value 和 multiprocessing.Array对象 ##
在进程间共享状态可以使用multiprocessing.Value和multiprocessing.Array这样特殊的共享内存对象：  
&emsp;&emsp;`Value(typecode_to_type , obj)`  
&emsp;&emsp;`Array(typecode_to_type , int | list | tuple... , lock=True)`  
Array的第二个参数传入为int类型的一个数的时候，会初始化值为0长度为这个值的数组


	typecode_to_type = {
	    'c': ctypes.c_char,
	    'b': ctypes.c_byte,  'B': ctypes.c_ubyte,
	    'h': ctypes.c_short, 'H': ctypes.c_ushort,
	    'i': ctypes.c_int,   'I': ctypes.c_uint,
	    'l': ctypes.c_long,  'L': ctypes.c_ulong,
	    'f': ctypes.c_float, 'd': ctypes.c_double
	    }
读写Value数据用属性v.value,读写Array数据用切片运算a[i]

	from multiprocessing import Pipe, Process,Value,Array
	def worker(v,a):
	    v.value = 1.2
	    for i in range(10):
	        a[i] = -i
	
	if __name__ == "__main__":
	    v = Value('f',0.0)
	    a = Array('i',range(10))
	    print v.value
	    print a[3]
	    p = Process(target=worker,args=(v,a))
	    p.daemon = True
	    p.start()
	    p.join()
	    print v.value
	    print a[3]

## multiprocessing.Manager对象 ##
multiprocessing.Manager对象创建一个服务进程，像是一个保存状态的代理，其他进程通过与代理的接口通信取得状态信息，服务进程支持更多的数据类型，使用起来比共享内存更灵活。

	from multiprocessing import Process, Manager
	
	def func(d, l):
	    d['1'] = 2
	    d[2] = 'str'
	    d[3.0] = None
	    for i in range(len(l)):
	        l[i] = -i
	
	if __name__ == "__main__":
	    m = Manager()
	    l = m.list(range(10))
	    d = m.dict()
	    p = Process(target=func, args=(d, l,))
	    p.start()
	    p.join()
	
	    print d
	    print l

## multiprocessing.Pool对象 ##
&emsp;&emsp;在利用Python进行系统管理的时候，特别是同时操作多个文件目录，或者远程控制多台主机，并行操作可以节约大量的时间。当被操作对象数目不大时，可以直接利用multiprocessing中的Process动态成生多个进程，十几个还好，但如果是上百个，上千个目标，手动的去限制进程数量却又太过繁琐，此时可以发挥进程池的功效。  
&emsp;&emsp;Pool可以提供指定数量的进程，供用户调用，当有新的请求提交到pool中时，如果池还没有满，那么就会创建一个新的进程用来执行该请求；但如果池中的进程数已经达到规定最大值，那么该请求就会等待，直到池中有进程结束，才会创建新的进程来执行它。

	#coding: utf-8
	import multiprocessing
	import time
	
	def func(msg):
	    print "msg:", msg
	    time.sleep(3)
	    print "end"
	
	if __name__ == "__main__":
	    pool = multiprocessing.Pool(processes = 3)
	    for i in xrange(4):
	        msg = "hello %d" %(i)
	        pool.apply_async(func, (msg, ))   #维持执行的进程总数为processes，当一个进程执行完毕后会添加新的进程进去
	
	    print "Mark~ Mark~ Mark~~~~~~~~~~~~~~~~~~~~~~"
	    pool.close()
	    pool.join()   #调用join之前，先调用close函数，否则会出错。执行完close后不会有新的进程加入到pool,join函数等待所有子进程结束
	    print "Sub-process(es) done."  
函数解释：  
* apply_async(func[, args[, kwds[, callback]]]) 它是非阻塞，apply(func[, args[, kwds]])是阻塞的（理解区别，看例1例2结果区别）  
* close()    关闭pool，使其不在接受新的任务  
* terminate()    结束工作进程，不在处理未完成的任务。  
* join()    主进程阻塞，等待子进程的退出， join方法要在close或terminate之后使用。  

执行说明：  
&emsp;&emsp;创建一个进程池pool，并设定进程的数量为3，xrange(4)会相继产生四个对象[0, 1, 2, 4]，四个对象被提交到pool中，因pool指定进程数为3，所以0、1、2会直接送到进程中执行，当其中一个执行完事后才空出一个进程处理对象3，所以会出现输出“msg: hello 3”出现在"end"后。因为为非阻塞，主函数会自己执行自个的，不搭理进程的执行，所以运行完for循环后直接输出“mMsg: hark~ Mark~ Mark~~~~~~~~~~~~~~~~~~~~~~”，主程序在pool.join（）处等待各个进程的结束。

## multiprocessing.Semaphore对象 ##
Semaphore用来控制对共享资源的访问数量，例如池的最大连接数。当连接数量达到设定值后，只有当旧的连接释放掉，才会为资源创建新连接。  

	import multiprocessing
	import time
	
	def worker(s, i):
	    s.acquire()
	    print(multiprocessing.current_process().name + "acquire");
	    time.sleep(i)
	    print(multiprocessing.current_process().name + "release\n");
	    s.release()
	
	if __name__ == "__main__":
	    s = multiprocessing.Semaphore(2)
	    for i in range(5):
	        p = multiprocessing.Process(target = worker, args=(s, i*2))
	        p.start()

## multiprocessing.Event对象 ##
Event用来实现进程间同步通信。

	import multiprocessing
	import time
	
	def wait_for_event(e):
	    print("wait_for_event: starting")
	    e.wait()
	    print("wairt_for_event: e.is_set()->" + str(e.is_set()))
	
	def wait_for_event_timeout(e, t):
	    print("wait_for_event_timeout:starting")
	    e.wait(t)
	    print("wait_for_event_timeout:e.is_set->" + str(e.is_set()))
	
	if __name__ == "__main__":
	    e = multiprocessing.Event()
	    w1 = multiprocessing.Process(name = "block",
	            target = wait_for_event,
	            args = (e,))
	
	    w2 = multiprocessing.Process(name = "non-block",
	            target = wait_for_event_timeout,
	            args = (e, 2))
	    w1.start()
	    w2.start()
	
	    time.sleep(3)
	
	    e.set()
	    print("main: event is set")