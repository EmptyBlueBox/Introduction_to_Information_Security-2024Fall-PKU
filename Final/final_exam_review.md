# 信息安全引论期末复习

## 考试范围

1. 往年平时作业 30% , 期末考试 70% 优秀率正好 40%
2. 往年期末中作业题目占比 60%

## 小测题目 (包含自测和随堂测试)

1. **绝大多数基于网络的对称加密应用程序使用流密码.**

   - [ ] A. 正确
   - [x] B. 错误

   **解析:**
   - 分组密码 (如 `AES`) 是大多数基于网络的对称加密应用程序的首选.

2. **Feistel 密码结构, 基于 1945 年 Shannon 的建议, 是目前许多重要的对称分组密码使用的结构.**

   - [x] A. 正确
   - [ ] B. 错误

   **解析:**
    - Feistel 结构: 交替使用代替  (substitution) 和置换  (permutation) , 是混淆 (confusion) 和扩散 (diffusion) 概念的应用.
    - **混淆: 代替, 消除密钥和密文之间的统计特征.**
    - **扩散: 置换, 消除明文和密文之间的统计特征.**
    - 分组加密算法就是在一个块上的一一映射, 如果块大小比较小, 那就类似代替变换, 把每个块代替为另一个块; 如果块大小比较大, 那就需要存储这个一一映射, 需要 $O(n2^n)$ 的存储空间.
    - 这样的存储空间太大了, 所以我们使用 Feistel 结构, 交替使用代替和置换, 来近似完美的分组加密算法.

3. **数据加密标准 DES 使用的是 56 位分组和 64 位密钥.**

   - [ ] A. 正确
   - [x] B. 错误

   **解析:**
   - DES 实际上使用的是 64 位分组和 56 位密钥 (8 位用于校验) .

4. **使用较小分组尺寸的理想分组密码的一个问题是, 它容易受到明文统计分析的影响.**

   - [x] A. 正确
   - [ ] B. 错误

   **解析:**
   - 较小分组尺寸的密码容易暴露明文的统计特性, 因此更容易被分析和破解.

5. **如果位流生成器是密钥控制算法, 则两个用户只需要共享生成密钥, 然后每个用户都可以生成密钥流.**

   - [x] A. 正确
   - [ ] B. 错误

   **解析:**
   - 密钥控制的位流生成器允许用户通过共享的种子生成相同的密钥流.

6. **在所有其他条件相同的情况下, 分组较小的分组密码具有较大的安全性.**

   - [ ] A. 正确
   - [x] B. 错误

   **解析:**
   - 较小分组的密码更容易受到统计分析的影响, 安全性较低.

7. **混淆试图使明文和密文之间的统计关系尽可能复杂, 以阻止试图推断出密钥.**

   - [ ] A. 正确
   - [x] B. 错误

   **解析:**
   - 混淆的目的是隐藏密钥与密文之间的关系, 而非明文与密文.

8. **AES 采用 Feistel 结构.**

   - [ ] A. 正确
   - [x] B. 错误

   **解析:**
   - AES算法的轮变换中没有Feistel结构.该结构由四个阶段组成, 
     - 字节代替: 
     - 行移位: 简单的置换
     - 列混淆: 一个利用在GF (28) 上的算术特性的代替
     - 密钥加层: 轮密钥简单地异或到中间状态上.

9. **可以使用密码反馈、输出反馈和计数器模式将分组密码转换为流密码.**

   - [x] A. 正确
   - [ ] B. 错误

   **解析:**
   - CFB, OFB, CTR 允许分组密码模拟流密码功能.
   - ECB, CBC 不能模拟流密码功能.
   - 流密码不需要将明文长度填充分组长度的整数倍, 并且可以实时操作. 因此, 如果正在传输一个字符流, 那么使用一个面向字符的流密码可以加密每个字符并立即传输. 

   <img src="./final_exam_review.assets/CleanShot 2025-01-02 at 01.09.22@2x.png" alt="CleanShot 2025-01-02 at 01.09.22@2x" style="zoom:50%;" />

10. **__密码是一次对数字数据流进行一位或一字节加密的密码.**

    - [ ] A. 乘积
    - [ ] B. 分组
    - [ ] C. 密钥
    - [x] D. 流

    **解析:**
    - 流密码逐位或逐字节加密数据流, 是流密码的主要特性.

11. **分组密码是将明文分组作为一个整体来处理, 并用于产生等长的密文分组的密码.**

    - [ ] A. 乘积
    - [x] B. 分组
    - [ ] C. 密钥
    - [ ] D. 流

    **解析:**
    - 分组密码以固定大小的块处理明文并生成等长的密文块.

12. **Feistel 密码的轮数越多, 进行密码分析就越__.**

    - [ ] A. 更容易
    - [ ] B. 难度更小
    - [ ] C. 同样困难
    - [x] D. 更难

    **解析:**
    - 轮数的增加提高了密码的复杂性, 使得分析更加困难.

13. **Feistel 提出, 我们可以通过使用__密码的概念来近似理想分组密码, 即按顺序执行两个或多个简单密码, 从而使最终的密码强度大于任何组成密码.**

    - [ ] A. 线性的
    - [ ] B. 置换
    - [ ] C. 差分的
    - [x] D. 乘积

    **解析:**
    - 乘积密码的概念通过组合简单密码增强了整体强度.

14. **对明文元素序列的__变换, 这意味着序列中没有添加、删除或替换元素, 而是改变了元素在序列中出现的顺序.**

    - [x] A. 置换
    - [ ] B. 扩散
    - [ ] C. 流
    - [ ] D. 代替

    **解析:**
    - 置换改变了序列中元素的顺序, 但不改变元素本身.
    - 混淆: 代替, 消除密钥和密文之间的统计特征.
    - 扩散: 置换, 消除明文和密文之间的统计特征.

15. **三重 DES 使用__级的 DES 算法, 总共使用两个或三个不同的密钥.**

    - [ ] A. 九
    - [ ] B. 六
    - [ ] C. 十二
    - [x] D. 三

    **解析:**
    - 顾名思义三重 DES 使用三个级别的加密, 每级使用不同的密钥.

    <img src="./final_exam_review.assets/CleanShot 2025-01-02 at 01.28.42@2x.png" alt="CleanShot 2025-01-02 at 01.28.42@2x" style="zoom:50%;" />

16. **这两个__都产生独立于明文和密文的输出.这使得它们成为流密码的自然候选者, 流密码通过 XOR 一次加密一个完整分组的明文.**

    - [ ] A. CBC 和 ECB
    - [x] B. OFB 和 CTR
    - [ ] C. ECB 和 OFB
    - [ ] D. CTR 和 CBC

    **解析:**
    - OFB 和 CTR 模式的输出独立于明文和密文, 适合作为流密码.
    - CFB 也是, 只不过没有这个选项.

17. **__最显著的特点是, 如果相同的 b 位明文块在消息中出现多次, 它总是产生相同的密文.**

    - [x] A. ECB
    - [ ] B. CTR
    - [ ] C. CBC
    - [ ] D. CFB

    **解析:**
    - ECB 模式的主要缺点是相同的明文块会生成相同的密文块.

    <img src="./final_exam_review.assets/Cursor 2025-01-02 01.51.54.png" alt="Cursor 2025-01-02 01.51.54" style="zoom:40%;" />

18. **__指以给定格式获取明文并以相同格式生成密文的任何加密技术.**

    - [x] A. format-preserving encryption (FPE)
    - [ ] B. Cipher Feedback (CFB)
    - [ ] C. electronic codebook mode (ECB)
    - [ ] D. Cipher Block Chaining (CBC)

    **解析:**
    - 顾名思义格式保留加密 (FPE) 在加密后保持数据格式不变.

19. **__是明文或密钥的小变化都会使密文产生大的变化.**

    - [x] A. 雪崩效应
    - [ ] B. 密钥扩展
    - [ ] C. 辅助交换
    - [ ] D. Rcon

    **解析:**
    - 雪崩效应描述了加密算法对输入敏感性的特性.
    - 密钥扩展算法: AES 密钥扩展算法的输入值是4个字 (16字节) , 输出值是由44个字 (176字节) 组成的一维线性数组. 这足以为初始密钥加阶段和其他10轮中的每轮提供4个字的轮密钥. 
    - 辅助交换: 辅助交换是一种密码技术, 用于在加密过程中交换辅助信息.
    - Rcon: 在 AES 加密过程中, Rcon 是一个常量数组, 用于生成轮密钥.

20. **在 AES 加密过程的一般结构中, 加密和解密算法处理的分组长度是__.**

    - [x] A. 128 位
    - [ ] B. 64 位
    - [ ] C. 256 位
    - [ ] D. 32 位

    **解析:**
    - AES 的标准分组长度是 128 位.
    - DES 的标准分组长度是 64 位.

21. 如果 $p$ 是素数, $a$ 是正整数, 那么 $a^p \equiv a \pmod{p}$ 是__定理的推广.

    - [ ] A. Rijndael’s
    - [ ] B. Vignere’s
    - [ ] C. Euler’s
    - [x] D. Fermat’s

    **解析:**
    - 费马小定理: 如果 $p$ 是素数, $a$ 是不被 $p$ 整除的正整数, 那么 $a^p \equiv a \pmod{p}$

22. 在__中, 攻击者为攻击者选择的特定消息伪造签名.

    - [ ] A. 强力攻击
    - [ ] B. 一般性伪造
    - [ ] C. 存在性伪造
    - [x] D. 选择性伪造

    **解析:**
    - 强力攻击: 攻击者尝试所有可能的密钥, 直到找到正确的密钥.
    - 完全破译: C判断出了A的私钥.
    - 通用伪造: C掌握了一个有效的签名算法, 使得对任意消息都能等效地构建签名.
    - 存在性伪造: C至少可以伪造一条消息的签名, 但C不能控制该条消息.
    - 选择性伪造: C对所选择的特定消息能够伪造签名.

23. 下列哪种算法__是一种需要使用密钥的算法.

    - [ ] A. MD5
    - [ ] B. SHA-1
    - [ ] C. MD4
    - [x] D. MAC

    **解析:**
    - MD5, SHA-1, MD4 都是哈希函数, 不需要使用密钥.
    - MAC: 消息认证码, 需要使用密钥.
    - 使用一个密钥生成一个固定大小的小数据块, 并加入到消息中, 称MAC,  或密码校验和 (cryptographic checksum) 
      - 接收者可以确信消息M未被改变. 
      - 接收者可以确信消息来自所声称的发送者; 
      - 如果消息中包含顺序码, 则接收者可以保证消息的正常顺序; 
    - MAC函数类似于加密函数, 但不需要可逆性. 因此在数学上比加密算法被攻击的弱点要少. 

24. MAC函数是__函数.

    - [ ] A. 一对多
    - [x] B. 多对一
    - [ ] C. 一对一
    - [ ] D. 一对二

    **解析:**
    - MAC 函数是多对一的, 即多个不同的输入可以产生相同的输出.

25. 发现通信双方之间的通信量模式, 比如在面向连接的应用中, 确定连接的频率和持续时间, 确定消息的数量和长度, 是__攻击.
    
    - [x] A. 通信流分析
    - [ ] B. 窃听
    - [ ] C. 伪造
    - [ ] D. 内容修改

    **解析:**
    - 通信流分析: 分析通信双方之间的通信量模式.

26. 构造MAC的一种方法是使用对称分组密码, 使其对任意长度的输入产生__输出.

    - [x] A. 固定长度
    - [ ] B. 可变长度
    - [ ] C. 更长长度
    - [ ] D. 任意长度

    **解析:**
    - MAC 要求生成固定大小的小数据块.

27.  哈希函数的主要目的是__.

    - [x] A. 数据完整性
    - [ ] B. 压缩
    - [ ] C. 抗碰撞性
    - [ ] D. 映射消息

    **解析:**
    - 作为实现 HMAC 的工具, 哈希函数没有可逆性, 的主要目的也是数据完整性.

28.  __是一种算法, 在计算上无法找到 (a) 映射到预先指定的散列结果的数据对象或 (b) 映射到相同散列结果中的两个数
     
    - [x] A. 密码学的散列函数
    - [ ] B. 强抗碰撞能力
    - [ ] C. 单向散列函数
    - [ ] D. 压缩函数

    **解析:**
    - 为什么不是单向散列函数? 因为课程讲的就是密码学的散列函数(?)

29. 密码学的散列函数要求__, 该要求保证不可能找到与给定消息具有相同散列值的替代消息, 这样可使用加密散列码防止伪造.

    - [ ] A. 抗碰撞
    - [ ] B. 伪随机性
    - [ ] C. 抗原像攻击
    - [x] D. 抗第二原像攻击

    **解析:**
    - 密码学哈希函数 H 的安全要求:

    <img src="./final_exam_review.assets/Cursor 2025-01-02 02.15.01.png" alt="Cursor 2025-01-02 02.15.01" style="zoom:50%;" />

30. __是用于验证消息完整性的机制或服务.

    - [x] A. 消息鉴别
    - [ ] B. 数据压缩
    - [ ] C. 数据映射
    - [ ] D. 消息摘要

    **解析:**
    - 消息鉴别 (Message Authentication): 是一个证实收到的消息来自可信的源点且未被篡改的过程. 
    - 数据压缩 (Data Compression) : `zip` 压缩...呗...
    - 数据映射 (Data Mapping) : 不知道...口牙...
    - 消息摘要 (Message Digest) : 一个散列函数以一个变长的报文作为输入, 并产生一个固定长度的散列码, 有时也称报文摘要, 作为输出. 是一个公开的函数. 

31. SHA-1产生__位的散列值.

    - [ ] A. 224
    - [x] B. 160
    - [ ] C. 384
    - [ ] D. 256

    **解析:**
    - SHA-1 产生 160 位的散列值, 参考课本.

    <img src="./final_exam_review.assets/Cursor 2025-01-02 02.22.03.png" alt="Cursor 2025-01-02 02.22.03" style="zoom:50%;" />

32. 密码学散列函数的要求包括__, 这是单向属性.

    - [ ] A. 抗碰撞
    - [ ] B. 伪随机性
    - [x] C. 抗原像攻击
    - [ ] D. 抗第二原像攻击

    **解析:**
    - 参见 29 题.

33. Alice 设计了一个密码系统, 采用密钥长度为128位的AES算法加密消息, 如果要采用RSA算法来加密AES算法的密钥, RSA算法的模n至少应该是多少位, 才能保证信息系统的安全性？

    - [ ] A. 1024
    - [ ] B. 2048
    - [x] C. 3072
    - [ ] D. 7068

    **解析:**
    - 辨析:
      - DES, AES: 对称密码
      - RSA: 非对称密码
      - DSA: 数字签名

    - 参考课件.

    <img src="./final_exam_review.assets/image-20250109014341701.png" alt="image-20250109014341701" style="zoom:50%;" />

    - 参考 [NIST SP 800-57](https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-57pt1r5.pdf) Page 55.

    <img src="./final_exam_review.assets/Safari浏览器 2025-01-02 02.38.02.png" alt="Safari浏览器 2025-01-02 02.38.02" style="zoom:30%;" />

34. 消息鉴别可以保护通信双方进行信息交换, 防止任何第三方的破坏, 但是, 它不能保护通信双方不受对方的伤害.

    - [x] A. 对
    - [ ] B. 错

    **解析:**
    - 消息鉴别不能防止通信双方受到对方的伤害, 但是数字签名可以, 这就是数字签名的作用.

35. 数字签名功能不包括鉴别功能.

    - [ ] A. 对
    - [x] B. 错

    **解析:**
    - 数字签名功能包括鉴别功能.
    - 消息鉴别 (Message Authentication): 是一个证实收到的消息来自可信的源点且未被篡改的过程. 
    - 数字签名 (digital signatures) 可以提供如下功能: 
      - 签名者事后不能否认自己的签名
      - 接收者能验证签名, 而任何其他人都不能伪造签名. 
      - 在有争议时, 可由第三方进行验证
      - 对签名的作者、日期和时间、签名时刻消息的内容提供验证
    - 因此, 数字签名提供了鉴别之外的附加功能

36. DSA中使用散列函数.

    - [x] A. 对
    - [ ] B. 错

    **解析:**
    - DSA 是签名算法, 使用散列函数.
    - DSS (数字签名标准) 使用 SHA 作为散列函数.

37. Schnorr签名方案基于离散对数.

    - [x] A. 对
    - [ ] B. 错

    **解析:**
    - Schnorr 签名方案基于离散对数.

38. 与RSA不同, DSS不能用于加密或密钥交换.

    - [x] A. 对
    - [ ] B. 错

    **解析:**
    - DSS 不能用于加密或密钥交换, DSS  (Digital signature Standard) , DSA (Digital signature algorithm)
    - 一个签名方案是一个满足下列条件的五元组 $(P, A, K, S, V)$: 
      - $P$ 是所有可能消息组成的一个有限集合
      - $A$ 是由所有可能的签名组成的一个有限集合
      - $K$ 为密钥空间, 它是由所有可能密钥组成的一个有限集合
      - 对每一个 $k\in K$, 有一个签名算法 $sig_k\in S$ 和一个相应的验证算法 $ver_k\in V$. 
      - 对每一个消息 $x\in P$ 和每一个签名 $y\in A$, 每一个 $sig_k:P\to A$ 和 $ver_k:P\times A\to\{true,false\}$ 都是满足下列条件的函数
        - $ver_k(x, y) = true \iff y = sig_k(x)$
        - 由 $x\in P$ 和 $y\in A$ 组成的数据对 $(x,y)$ 称为签名消息. 
    - 可以看出来, DSS 只能将消息和签名 pair 起来, 不能进行任何形式的加密.

39. 在数字签名算法DSA中, 如果签名的生成过程导致值 $s=0$, 则应生成新的 $k$ 值.

    - [x] A. 对
    - [ ] B. 错

    **解析:**
    - 在数字签名算法 DSA 中, 如果签名的生成过程导致值 $s=0$, 则应生成新的 $k$ 值.
    - $s^{-1} \mod q$ 要存在 $\iff s \neq 0 \mod q$, 如果发生, 接收者可拒绝该签名. 要求重新构造该签名, 实际上, $s \equiv 0 \mod q$ 的概率非常小 $(2^{-160})$
    - 用户产生的签名 $s=0$, 会泄露私钥 :
      - $s = 0 = k^{-1}[H(m) + xr] \mod q$
      - $x = -H(m)r^{-1} \mod q$

40. 拥有共享密钥的接收者无法生成验证消息完整性的鉴别码.

    - [ ] A. 对
    - [x] B. 错

    **解析:**
    - 拥有共享密钥的接收者可以生成验证消息完整性的鉴别码, 因为 MAC 消息鉴别码的原理是接受者也计算一个消息鉴别码, 并和发送者的鉴别码进行比较.

41. 消息加密本身不能提供消息鉴别.

    - [ ] A. 对
    - [x] B. 错

    **解析:**
    - 消息加密本身可以提供消息鉴别, 比如 `CMAC` 是基于分组密码的消息鉴别码.

42. SHA3-512生成的消息摘要长度为64字节.

    - [x] A. 对
    - [ ] B. 错

    **解析:**
    - SHA3-512 中 512 表示输出长度为 512 位, 即信息摘要长度为 64 字节.
    - 参考课件 Chapter 5.

    <img src="./final_exam_review.assets/Cursor 2025-01-09 01.45.28.png" alt="Cursor 2025-01-09 01.45.28" style="zoom:40%;" />

43. 如果消息仅被改写了1比特, 则用SHA-1生成的消息摘要值也仅发生1比特的改变.

    - [ ] A. 对
    - [x] B. 错

    **解析:**
    - 由于雪崩效应, 消息仅被改写了1比特, 则用 SHA-1 生成的消息摘要值将发生许多比特的改变.

44. 使用消息鉴别码能保证消息的机密性.

    - [ ] A. 对
    - [x] B. 错

    **解析:**
    - 使用消息鉴别码不能保证消息的机密性, 只能保证消息的完整性, 来自可信的源点, 但是所有人都能看到消息明文.

45. 使用消息鉴别码能够防止否认.

    - [ ] A. 对
    - [x] B. 错

    **解析:**
    - 使用消息鉴别码不能够防止否认, 需要数字签名.

46. 采用对称分组密码对明文加密时, 如果明文的长度恰好是对称密码分组长度的整数倍, 则不需要填充.

    - [ ] A. 对
    - [x] B. 错

    **解析:**
    - 如果明文的长度恰好是对称密码分组长度的整数倍, 也需要填充, 否则无法确定是否有填充存在. 详见第二次作业第二题.

47. 在DSS  (Digital signature Standard) 中, 签名所使用的随机数k可以泄露出去.

    - [ ] A. 对
    - [x] B. 错

    **解析:**
    - 在 DSS 中, 签名所使用的随机数 k 不能泄露出去.
    - 不能将签名所使用的随机数 k 泄露出去, 如果签名中所使用的随机数 k 泄露了, 那么任何知道的人可由方程 $s=[k^{-1}(H(M)+xr)] \mod q$ 求出 $x=[sk-H(m)]r^{-1} \mod q$, 一旦 $x$ 被知道, 攻击者就可以任意伪造签名.
    - 所以也不要使用同一个 $k$ 签两个不同的消息.

48. 将压缩算法和加密算法结合使用效果更好, 另外, 如果用户在传输的信息中还想加入纠错编码.那么, 下面哪一种顺序是合理的__

    - [ ] A. 纠错编码、加密、压缩
    - [ ] B. 加密、压缩、纠错编码
    - [x] C. 压缩、加密、纠错编码
    - [ ] D. 压缩、纠错编码、加密

    **解析:**
    - Chapter 7.
    - 将压缩算法和加密算法结合使用效果更好.
      - 密码分析依赖于明文中的数据冗余, 而压缩明文会减少这种冗余.
      - 减少加密时间.
    - 纠错码应在加密之后.

    <img src="./final_exam_review.assets/Cursor 2025-01-02 03.14.26.png" alt="Cursor 2025-01-02 03.14.26" style="zoom:50%;" />

49. 保证保密性的强制访问控制模型 Bell-LaPadula 模型的读写规则是

    - [ ] A.无下读, 无上写
    - [ ] B.无下读, 无下写
    - [ ] C.无上读, 无上写
    - [x] D.无上读, 无下写

    **解析:**
    - Lecture 12.
    - Bell-LaPadula: 保证保密性
      - 简单安全特性 (无上读) : 仅当 $l(o) \leq l(s)$ 且 $s$ 对 $o$ 具有自主型读权限时, $s$ 可以读取 $o$
      - 特性 (无下写) : 仅当 $l(s) \leq l(o)$ 且 $s$ 对 $o$ 具有自主型写权限时, $s$ 可以写 $o$

50. 口令验证中插入实时延迟是对付口令猜测的一种措施

    - [x] A. 对
    - [ ] B. 错

    **解析:**
    - Lecture 11.
    - 对付口令猜测的措施:
      - 教育、培训; 
      - 严格限制非法登录的次数; 
      - 口令验证中插入实时延迟; 
      - 限制最小长度, 至少6~8字节以上
      - 防止用户特征相关口令, 
      - 口令定期改变; 
      - 及时更改预设口令; 
      - 使用机器产生的口令. 

51. 在 Biba 模型中, 系统包含主体集合 S、客体集合 O 和一个完整性集合 I, 每个主体集 S 中的主体 s 及客体集 O 中的客体 o, 都属于一个固定的完整性级别 i, 这些级别是有序的, 它遵循以下原则: 

    - [ ] A.无下写, 无上读
    - [ ] B.无上写, 无上读
    - [x] C.无上写, 无下读
    - [ ] D.无下写, 无下读

    **解析:**
    - Lecture 12.
    - 无上写: 当且仅当 $i(s) \geq i(o)$, $s \in S$ 可以写入 $o \in O$; 
    - 无下读: 当且仅当 $i(o) \geq i(s)$, $s \in S$ 可以读取 $o \in O$; 

52. Kerberos 是基于口令的鉴别协议

    - [x] A. 对
    - [ ] B. 错

    **解析:**
    - Lecture 11.
    - Kerberos 是基于口令的鉴别协议.
    - 引入鉴别服务器(AS), 
      - 它知道所有用户的**口令**并将它们存储在一个中央数据库中. 
      - AS 与每一个服务器共有一个唯一的保密密钥. 这些密钥已经物理上或以更安全的手段分发. 
