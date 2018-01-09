---
layout: 'python'
title: M2Crypto使用
date: 2018-01-03 13:46:55
comments: true
categories:
- python
tags:
- python
- crypt
- rsa
---
加解密数据、操作密钥、操作SSL协议普遍使用了OpenSSL。虽然还有其它的使用C/C++开发的加密处理库，但是Python环境下支持最好的使用最广泛的还是OpenSSL。 

据python.org官方网站，目前有三个库提供了OpenSSL的包装。 
  
1. PyOpenSSL。这个库是比较早的，但是作者已经停止开发，并且只支持SSL功能，而没有提供加密、解密、X509等功能的包装。 
2. M2Crypto。完整支持OpenSSL。单元测试比较全面。在原有C语言API的基础上提供了Python的封装。 
3. ssl4py。与M2Crypto类似。但是完全使用C编写，与OpenSSL的API很类似。估计是用SWIG之类的工具生成的。据我本人看他的源代码，在调用EVP_CipherUpdate()函数的时候，输出大小没有计算正确。此错误会造成数据不正确，是一个比较严重的BUG。我估计应该还有其它的BUG存在，可能比较不成熟。 
4. ezPyCrypto。全名是Python Cryptography Toolkit。据水木网友josephpei说，这个很强大，有望进入官方CPython的标准库内。不过考虑到学习OpenSSL的API以后找工作比较好办，所以暂时不考虑。 
  
综上所述，我在开发中使用M2Crypto。 
  
M2Crypto的API手册处于：http://www.heikkitoivonen.net/m2crypto/api/ 
  
目前，截止到2009年10月23日，官网上提供的M2Crypto for Python 2.6(win32)安装包是不正确的。因为它提供的0.19版本并没有兼容0.20。所以需要下载M2Crypto的源代码自行编译。以下是编译的步骤： 
  
1. 下载安装mingw32:http://www.mingw.org. 
2. 下载安装 swig: http://www.swig.org。选择下载SWIG for python(win32)的版本。并且把swig的路径加入$PATH环境变量内。 
3. 下载安装OpenSSL的Windows版本:http://www.slproweb.com/products/Win32OpenSSL.html 
4. 把OpenSSL的include文件夹复制到Python的include文件夹内。把OpenSSL的几个库文件(*.a)复制到mingw32的lib文件夹内。 
5. OpenSSL for windows的库文件与for Unix版本名字有些不大一样。需要把libeay32.dll.a改名liblibeay32.a，把libssl32.dll.a改名libssleay32.a。测试的版本是0.9.8h 
6. 运行setup.py build -c mingw32 bdist_wininst 
7. 一切顺利的话在dist文件夹下可以找到安装程序。 
  
>M2Crypto主页提供了一处描述如何在windows平台下使用msvc编译openssl和M2Crypto的链接。经过试验，该方法不能在mingw32下成功。不过在一个用户评论上描述了mingw32下的方法，当时没仔细看，害我搞了半天没成功。 
  
***
经过我测试，编译后的M2Crypto虽然导入正常，但是一旦使用BIO进行文件操作，M2Crypto就会异常退出。并打印出No AppLink这样的错误信息。如果不使用BIO的话，好像又没啥问题。 
***
  
下面是几个模块的大致介绍: 

	M2Crypto.BIO 用于操作IO抽象类型。 
	M2Crypto.BN 用于操作大数 
	M2Crypto.DH 用于操作Diffie-Hellman key exchange protocol 
	M2Crypto.EVP 高级的加密解密接口。与直接使用具体的加密算法不同。使用该接口，可以用相同的编程方式，调用不同的算法处理数据。它包含了对称加密算法与非对称加密算法的支持。 
	M2Crypto.EC 椭圆曲线非对称加密算法 
	M2Crypto.DSA DSA非对称加密算法 
	M2Crypto.RSA RSA非对称加密算法 
	M2Crypto.Rand 操作随机数 
	M2Crypto.SSL 操作SSL协议 
	M2Crypto.X509 操作X509 
  
接下来，我们通过日常的编程任务来看看如何使用这些接口。 
  
#### 一、如何使用MD5、SHA1等消息散列算法。 
  
虽然OpenSSL提供了直接操作MD5、SHA1算法以及blowfish等各种对称加密算法的API，但是M2Crypto并没有将其包含进来。不过也好，各种算法都有各自的API，记起来麻烦。通过M2Crypto.EVP，我们仍然可以调用这些算法。下面是一个MD5的例子： 
  
	def md5(s): 
     m=EVP.MessageDigest("md5") #在构造函数中传入算法的名字可以选择不同的消息散列算法 
     m.update(s) 
     return m.digest() #或者m.final() 
  
常用的散列算法还有sha1。使用方法与MD5类似，只是构造函数是： 

	m=EVP.MessageDigest("sha1") 
  
#### 二、使用对称加密算法加密数据。 
  
如前所述，我们需要使用EVP.Cipher这个比较抽象的API，而不是具体的算法。与EVP.MessageDigest()类似，EVP.Cipher主要提供四个函数： 
  
	EVP.Cipher.__init__(self, alg, key, iv, op, key_as_bytes=0, d='md5', salt='12345678', i=1, padding=1) 
	EVP.Cipher.update(self, data) 
	EVP.Cipher.final() 
	EVP.Cipher.set_padding(self, padding=1) 
  
下面是一段使用blowfish算法将明文"fish is here"加密成密文的函数代码： 
  
	def blowfish_encrypt(s, password): 
     	    out=StringIO() 
     	    m=EVP.Cipher("bf_ecb", password, "123456", 1, 1, "sha1", "saltsalt", 5, 1) 
     	    out.write(m.update(s)) 
     	    out.write(m.final()) 
     	    return out.getvalue() 
  
可以发现，最主要的是Cipher的构造函数: 

	EVP.Cipher.__init__(self, alg, key, iv, op, key_as_bytes=0, d='md5', salt='12345678', i=1, padding=1) 
  
alg是指算法的名字，OpenSSL支持以下算法： 
>des_cbc des_ecb des_cfb des_ofb 
>des_ede_cbc des_ede des_ede_ofb des_ede_cfb &emsp;&emsp;&emsp;&emsp;2DES算法 
>des_ede3_cbc des_ede3 des_ede3_ofb des_ede3_cfb &emsp;&emsp;3DES算法 
>desx_cbc 
>rc4 
>rc4_40 &emsp;&emsp; 密钥为40位的RC4算法 
>idea_cbc idea_ecb idea_cfb idea_ofb idea_cbc 
>rc4_cbc rc2_ecb rc2_cfb rc2_ofb 
>rc2_40_cbc rc2_64_cbc 
>bf_cbc bf_ecb bf_cfb bv_ofb &emsp;&emsp;&emsp;Blowfish算法 
>cast5_cbc cast5_ecb cast5_cfb cast5_ofb 
>rc5_32_12_16_cbc rc5_32_12_16_ecb rc5_32_12_16_cfb rc5_32_12_16_ofb 
  
key是加密所用的密钥。传入的是一段二进制数据，其长度是密钥的长度。不过，如果后面的参数key_as_bytes==1，那key是一个普通的任意长度的字符串，将与salt,i参数一起生成一个真正的密钥。比如说,假设算法alg的密钥长度是16，如果key_as_bytes==0，那么key应该传入"\xff\xff"两个字节的字符串。如果key_as_bytes==1，则可以传入类似于123456这样子的字符串。 
  
iv是指初始向量。与加密算法所使用的加密块的长度一致。有些加密算法并不使用iv这个变量。如果key_as_bytes==1。虽然OpenSSL的key_to_bytes()函数可以使用alt,key,salt,d,i四个参数生成真正的密钥和iv。但是M2Crypto内部并没有这样子做。而是直接使用原来的iv.如果iv的长度超过了加密算法所使用的加密块的长度，超过的长度会被截取。 
  
op用于指示解密或者加密操作。op==1表示加密操作;op==0表示解密操作。在做逆操作的时候，除了op不一样，其它参数应当保持一致。 
  
key_as_bytes参数如前所述。如果key_as_bytes==1。M2Crypto会使用alg, key, d, salt, i五个参数生成真正的密钥(注意，没有使用IV)。如果key_as_bytes==0，表示传入的是真正的密钥，d, salt, i三个参数就没有意义了。 
  
d是指生成密钥时所使用的散列算法。可以选择md5, sha1等。最好使用sha1，因为md5的破解看来只是时间问题了。  
  
salt是指生成密钥时所使用的盐。M2Crypto默认是123456。 
  
i是指生成密钥时所迭代的次数。迭代次数越多，使用暴力攻击就越不容易。 
  
padding是指填充加密块。大多数加密算法是以块为单位进行加密的。明文被切分为一个个固定大小的块。然后分别进行加密，得到与原来大小一致的加密块。但是明文的长度并不一定是加密块长度的整数倍。因此在处理最后一个块时需要进行填充。常用的填充算法是PKCS padding.如果没有允许padding并且最后一段明文不足以达到加密块的长度。EVP_EncryptFinal_ex()会返回一个错误。如果padding是允许的，但是密文最后并没有包含一个正确的填充块，EVP_DecryptoFinal()就会返回一个错误。padding默认是允许的。 
  
#### 三、 生成RSA密钥 
  
DSA与RSA是比较常用的两种非对称加密算法。他们的使用方法与特性正如他们的名字，基本上大同小异。在OpenSSL内，使用与其它名字一样的结构体来表示这两个算法的密钥。在M2Crypto里，也是如此。只是在M2Crypto里DSA与RSA是两个类，带有签名、验证等方法。 
  
一般并不构造RSA与DSA类。而使用相应的工厂方法。比如生成RSA密钥： 
  
	from M2Crypto import BIO, RSA 
	def genrsa(): #这函数生成一个1024位的RSA密钥，将其转化成PEM格式返回 
	     bio=BIO.MemoryBuffer() 
	     rsa=RSA.gen_key(1024, 3, lambda *arg:None) 
	     rsa.save_key_bio(bio, None) 
	     return bio.read_all() 
  
RSA.gen_key()是一个工厂方法，它返回一个存储了新的RSA密钥的RSA.RSA()实例。它的方法签名是： 

	gen_key(bits, e, callback=keygen_callback) 
  
bits参数是指RSA密钥的长度，1024以下的RSA密钥虽然还没有被破解，但是已经认为是不安全的了。作为CA使用的RSA密钥通常要求达到2048位以上。 
e是RSA算法的public exponent。功能是什么？我也不大清楚，据OpenSSL的文档说，这个函数通常是三个奇数3,17,65537之一。 
callback是一个回调函数。用于显示生成密钥的进度。具体请查阅OpenSSL的文档。 
  
这里是OpenSSL中对应的函数原型： 

	#include <openssl/rsa.h> 
	RSA *RSA_generate_key(int num, unsigned long e,void (*callback)(int,int,void *), void *cb_arg); 
  
#### 四、生成DSA密钥 
  
DSA算法相关的估计是另外的人开发的。API有些不大一样。它首先需要生成参数，然后才能生成密钥。以下是一段代码： 
  
	from M2Crypto import BIO, DSA 
	def gendsa(): #这函数生成一个1024位的DSA密钥，将其转化成PEM格式返回 
	     bio=BIO.MemoryBuffer() 
	     dsa = DSA.gen_params(1024, lambda *arg: None) 
	     dsa.gen_key() 
	     dsa.save_key_bio(bio,None) 
	     return bio.read_all() 
  
可以发现生成DSA密钥时需要首先使用DSA.gen_params()生成DSA参数。gen_params()函数的第一个参数是DSA密钥的长度，第二个密钥与RSA.gen_key()的回调函数相同。DSA.gen_params()返回一个DSA类的实例。调用DSA.gen_key()方法生成密钥。其它的与RSA类似。 
  
  
#### 五、载入DSA密钥与RSA密钥 
  
RSA: 
返回RSA类型： 

	load_key(file, callback=util.passphrase_callback) 
	load_key_bio(bio, callback=util.passphrase_callback) 
	load_key_string(string, callback=util.passphrase_callback) 
返回RSA_pub类型： 

	load_pub_key(file) 
	load_pub_key_bio(bio) 
  
DSA: 
返回DSA类型： 

	load_params(file, callback=util.passphrase_callback) 
	load_params_bio(bio, callback=util.passphrase_callback) 
	load_key(file, callback=util.passphrase_callback) 
	load_key_bio(bio, callback=util.passphrase_callback) 
返回DSA_pub类型： 

	load_pub_key(file, callback=util.passphrase_callback) 
	load_pub_key_bio(bio, callback=util.passphrase_callback) 
  
这些函数大同小异。如果参数名字是file的话，代表的是一个文件名。如果参数名字是bio的话，代表的是一个BIO对像。BIO对象与Python的file对象类似都是用于表示一个可以读写的类似于文件的类型。BIO对象除了可以是一个普通的文件，还可以是一个ssh连接，还可以是一段内存(BIO.MemoryBuffer)。BIO.MemoryBuffer与Python的StringIO.StringIO类似。因为之前我们提到我编译的M2Crypto在进行文件IO的时候会异常退出，所以最好只使用BIO.MemoryBuffer。 
  
在本文里，提到密钥，是同时指公钥与私钥。 
在OpenSSL及大多数软件里，因为公钥会被单独分发出去，所以公钥可以单独保存在公钥文件里。而密钥的所有者既然保存私钥，肯定也会同时保存公钥。故而私钥并不会单独保存到一个私钥文件里，而是和公钥一起保存在密钥文件里。 
  
#### 六、RSA类型的操作——使用RSA加密、解密、签名、认证；保存RSA密钥 
  
RSA类型封装了一些可以使用RSA密钥进行的操作。 
  
首先，可以使用len(rsa)获得RSA密钥的长度。单位是位，通常使用1024位以上的密钥才是安全的。 
  
public_encrypt(self, data, padding): 
使用公钥进行加密。data是数据，padding参数是指是否填充加密块。具体的含义可以看看EVP.Cipher类的构造函数。data是一段普通的字符串，而padding的类型是布尔型。 
  
	def public_decrypt(self, data, padding): 
使用公钥进行解密。 
  
	def private_encrypt(self, data, padding): 
使用私钥进行加密。 
  
	def private_decrypt(self, data, padding): 
使用公钥进行加密。 
  
因为RSA是一种非对称加密算法。所以用私钥加密的数据，要用公钥才能解密。反之，用公钥加密的数据，要用私钥才能解密。通常在通信中，发送方使用接收方的公钥加密数据。_只有_接收方才有私钥能够解密数据。因为非对称加密算法的速度一般比对称加密算法慢，所以在一个连续的通信过程中，经常是发送方随机生成一个对称加密算法的密钥，然后使用非对称加密算法发送给接收方，以后所有的通信过程都是使用这个随机密钥。只要保证每隔一段时间就换一个密钥，这个通信过程就跟直接使用非对称加密算法一样安全了。类似于电子邮件这样的通信过程中，双方商量一个随机密钥的时间很长，所以还是乖乖直接用公钥加密的好。 
  
非对称算法还经常用于对数据进行签名。签名可以保证发送方不能否认自己发送的数据是自己的。比如，在一个电子商务交易中，客户下了一个订单，不能等工厂已经生产完了才否认这个订单是自己下的。签名最简单的办法当然是使用发送方的私钥进行加密。如果不使用发送方的公钥就不能解密数据。反之，也可以说，凡是可以使用发送方的公钥解密出数据，就说明数据是使用发送方的私钥加密的。在现实生活中，人们一般是使用SHA1之类的散列算法算出数据的散列值，然后再用私钥加密这个散列值。接收方接收到数据与散列值之后，同样使用SHA1算法算出数据的散列值，与使用公钥解密出来的散列值作对比。如果是一样的，说明数据正确。如果不一样，或者是在传输过程中被更改了，或者根本不是发送方所发送的。 
  
RSA算法提供了两种签名的方式，其分别可能是不同的国际标准。我还不是很清楚。 
  
	sign_rsassa_pss(self, digest, algo='sha1', salt_length=20); 
	verify_rsassa_pss(self, data, signature, algo='sha1', salt_length=20) 
  
这组API与下面两个函数类似。看起来差不多的样子，不过我没有进行过测试。实际上OpenSSL中并没有sign_rsassa_pss()这样函数。它实际上是分为两个步骤： 

	RSA_padding_add_PKCS1_PSS()和 RSA_private_encrypt() 
而verify_rsassa_pss()函数则分为 

	RSA_public_decrypt()与 RSA_verify_PKCS1_PSS() 两个步骤 
	sign(self, digest, algo='sha1'): 
	verify(self, data, signature, algo='sha1') 
  
这组API对应于OpenSSL中的RSA_sign()与RSA_verify()函数。分别是签名与验证。虽然sign()方法接收散列算法的名字作为名字，但实际上digest参数应该是已经计算出的散列值。以下是对一段数据进行签名的代码： 
  
发送方对数据进行签名 

	from M2Crypto import * 
	m=EVP.EVP.MessageDigest("sha1") #先计算散列值 
	m.update("fish is here") 
	digest=m.final() 
	key_str=file("fish_private.pem","rb").read() #读入私钥 
	key=RSA.load_key_string(key_str, util.no_passphrase_callback) 
	result=key.sign(digest, "sha1") #签名后得到的数据。与原始数据一起发送出去。 
  
接收方验证数据 

	from M2Crypto import * 
	m=EVP.EVP.MessageDigest("sha1") #先计算散列值 
	m.update("fish is here") 
	digest=m.final() #先计算散列值 
	cert_str=file("fish_public.pem", "rb").read() #读入公钥 
	mb=BIO.MemoryBuffer(cert_str) 
	cert=RSA.load_pub_key_bio(mb) #RSA模式没有load_pub_key_string()方法，需自行使用MemoryBuffer 
	cert.verify(digest, result, "sha1") 
  
#### 七、一个小型的CA，电子证书。 
  
说到CA，不得不说到PKI认证体系。PKI体系是一个概念性的认证系统。它的基本原理是，通信系统内所有节点都承认一个权威的机构，称为CA。所有参与通信的节点都有一个电子证书，由该节点的公钥和身份认证信息组成。CA核查这个电子证书的身份信息是否正确。如果正确的话，就使用CA的秘钥进行签名。这样，所有的通信节点就可以使用电子证书内包含的身份信息而不必亲自核查了。 
  
所有通信节点都持有CA的电子证书。CA的电子证书是CA自己签名的。在PKI系统运行之前，人们会事先设置好CA证书。 
  
通信节点生成电子证书的过程是： 
1、通信节点生成RSA或者DSA等非对称加密算法的密钥。 
2、通信节点生成电子证书请求文件(X509_Request)。其中包含通信节点的身份信息、公钥，并且用通信节点的私钥签名。 
3、CA读取电子证书请求文件。核查身份信息是否正确。如果身份信息正确就生成通信节点的电子证书。其中包含CA的身份信息、通信节点的身份信息、通信节点的公钥、电子证书的起始有效时间，电子证书的结束有效时间。通常还会记录这是CA所颁发的第几个证书。
  
生成非对称加密算法的密钥在之前已经有提到过了。接下来是如何生成证书请求文件的代码： 
  
	from M2Crypto import * 
	#首先载入密钥文件。此文件同时保存了通信节点的私钥与公钥。 
	#这里并不像之前直接使用 
	pkey_str=file("fish_private.pem", "rb").read() 
	pkey=EVP.load_key_string(pkey_str, util.no_passphrase_callback) 
	req=X509.Request() 
	req.set_pubkey(pkey) #包含公钥 
	#req.set_version(1) 
	name=X509.X509_Name() #身份信息不是简单的字符串。而是X509_Name对象。 
	name.CN="Goldfish" #CN是Common Name的意思。如果是一个网站的电子证书，就要写成网站的域名 
	name.OU="Manager" #Organization Unit，通常是指部门吧，组织内单元 
	name.O="ZieglerT" #Organization。通常是指公司 
	name.ST="Fujian" #State or Province。州或者省 
	name.L="Quanzhou" #Locale。 
	name.C="CN" #国家。不能直接写国家名字，比如China之类的，而应该是国家代码。CN代表中国。US代表美国，JP代表日本 
	req.set_subject(name) #包含通信节点的身份信息 
	req.sign(pkey, "sha1") #使用通信节点的密钥进行签名 
	file("fish_req.pem", "wb").write(req.as_pem()) #写入到文件 
  
可以发现，如果简化那些设置身份信息的代码，实际上就是三步：包含公钥、包含身份信息、签名。 
  
接下来，我们看看CA是如何给一个通信节点发放证书的。 
  
	from M2Crypto import * 
	import time 
	#首先读取证书请求文件。 
	req_str=file("fish_req.pem", "rb").read() 
	req=X509.load_request_string(req_str) #返回一个X509.Request类型代表证书请求文件 
	print req.verify(req.get_pubkey()) #首先验证一下，是不是真的是使用它本身的私钥签名的。如果是，返回非0值。如果不是，说明这是一个非法的证书请求文件。 
	#接下来载入CA的电子证书。与CA的密钥不一样，CA的电子证书包含了CA的身份信息。CA的电子证书会分发给各个通信节点。 
	ca_str=file("ca.pem", "rb").read() 
	ca=X509.load_cert_string(ca_str) 
	#print ca.check_ca() #可以使用check_ca()方法判断这个证书文件是不是CA。本质是判断它是不是自签名。如果是的话，就返回非0值。如果不是的话就返回0。 
	#接下来载入CA的密钥 
	cakey_str=file("cakey.pem", "rb").read() 
	cakey=EVP.load_key_string(cakey_str, lambda *args:"1234") #一般CA的密钥要加密保存。回调函数返回密码 
	#接下来开始生成电子证书 
	cert=X509.X509() 
	#首先，设定开始生效时间与结束生效时间 
	t = long(time.time()) + time.timezone #当前时间，单位是秒 
	now = ASN1.ASN1_UTCTIME() #开始生效时间。证书的时间类型不是普通的Python datetime类型。 
	now.set_time(t) 
	nowPlusYear = ASN1.ASN1_UTCTIME() #结束生效时间 
	nowPlusYear.set_time(t + 60 * 60 * 24 * 365) #一年以后。 
	cert.set_not_before(now) 
	cert.set_not_after(nowPlusYear) 
	cert.set_subject(req.get_subject()) #把证书请求附带的身份信息复制过来 
	cert.set_issuer(ca.get_subject()) #设置颁发者的身份信息，把CA电子证书内身份信息复制过来 
	cert.set_serial_number(2) #序列号是指，CA颁发的第几个电子证书文件 
	cert.set_pubkey(req.get_pubkey()) #把证书请求内的公钥复制过来 
	cert.sign(cakey, "sha1") #使用CA的秘钥进行签名。 
	file("fishcert2.pem", "wb").write(cert.as_pem()) #保存文件。 
  
