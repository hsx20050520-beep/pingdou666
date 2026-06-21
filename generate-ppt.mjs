import PptxGenJS from 'pptxgenjs';

const pptx = new PptxGenJS();
pptx.layout = 'LAYOUT_WIDE'; // 16:9
pptx.author = 'Claw';
pptx.title = 'Java 核心技术精讲';

// ─── Color scheme ───
const C = {
  primary:    '1A73E8',   // blue
  secondary:  '34A853',   // green
  accent:     'EA4335',   // red
  dark:       '202124',   // near-black
  light:      'F8F9FA',   // light gray bg
  white:      'FFFFFF',
  gray:       '5F6368',
  codeBg:     '1E1E1E',
  codeFg:     'D4D4D4',
};

// ─── Helpers ───
function addSlideNum(slide, num, total) {
  slide.addText(`${num} / ${total}`, {
    x: 8.6, y: 5.5, w: 1.5, h: 0.4,
    fontSize: 9, color: C.gray, align: 'right',
    fontFace: 'Arial',
  });
}

function titleSlide(text) {
  const slide = pptx.addSlide();
  slide.background = { fill: C.dark };
  slide.addText(text, {
    x: 0.6, y: 0.3, w: 8.5, h: 0.6,
    fontSize: 20, bold: true, color: C.primary,
    fontFace: 'Arial',
  });
  // underline bar
  slide.addShape(pptx.ShapeType.rect, {
    x: 0.6, y: 0.9, w: 2.5, h: 0.05, fill: { color: C.primary },
  });
  return slide;
}

function contentSlide(title, items, opts = {}) {
  const slide = pptx.addSlide();
  slide.background = { fill: C.white };
  slide.addText(title, {
    x: 0.5, y: 0.25, w: 9.0, h: 0.55,
    fontSize: 18, bold: true, color: C.dark,
    fontFace: 'Arial',
  });
  slide.addShape(pptx.ShapeType.rect, {
    x: 0.5, y: 0.78, w: 9.0, h: 0.04, fill: { color: C.primary },
  });
  if (Array.isArray(items)) {
    const textItems = items.map((item, i) => {
      if (typeof item === 'string') {
        return { text: item, options: { bullet: true, fontSize: opts.code ? 12 : 14, fontFace: opts.code ? 'Courier New' : 'Arial', color: opts.code ? C.codeBg : C.dark } };
      }
      return item;
    });
    slide.addText(textItems, {
      x: 0.5, y: 1.0, w: 9.0, h: 4.2,
      valign: 'top', lineSpacingMultiple: 1.5,
    });
  }
  if (opts.footnote) {
    slide.addText(opts.footnote, {
      x: 0.5, y: 5.2, w: 9.0, h: 0.3,
      fontSize: 9, color: C.gray, fontFace: 'Arial', italic: true,
    });
  }
  return slide;
}

function codeSlide(title, code) {
  const slide = pptx.addSlide();
  slide.background = { fill: C.white };
  slide.addText(title, {
    x: 0.5, y: 0.25, w: 9.0, h: 0.55,
    fontSize: 18, bold: true, color: C.dark, fontFace: 'Arial',
  });
  slide.addShape(pptx.ShapeType.rect, {
    x: 0.5, y: 0.78, w: 9.0, h: 0.04, fill: { color: C.primary },
  });
  // code block
  const codeLines = code.split('\n').map(line => ({
    text: line,
    options: { bullet: false, fontSize: 10, fontFace: 'Courier New', color: C.codeFg, breakType: 'none' }
  }));
  // Add code background box
  slide.addShape(pptx.ShapeType.rect, {
    x: 0.5, y: 1.0, w: 9.0, h: Math.min(codeLines.length * 0.24 + 0.3, 4.5),
    fill: { color: C.codeBg }, rectRadius: 0.1,
  });
  slide.addText(codeLines, {
    x: 0.7, y: 1.1, w: 8.6, h: Math.min(codeLines.length * 0.24, 4.2),
    valign: 'top', lineSpacingMultiple: 1.1,
  });
  return slide;
}

function tableSlide(title, header, rows) {
  const slide = pptx.addSlide();
  slide.background = { fill: C.white };
  slide.addText(title, {
    x: 0.5, y: 0.25, w: 9.0, h: 0.55,
    fontSize: 18, bold: true, color: C.dark, fontFace: 'Arial',
  });
  slide.addShape(pptx.ShapeType.rect, {
    x: 0.5, y: 0.78, w: 9.0, h: 0.04, fill: { color: C.primary },
  });
  const allRows = [header, ...rows];
  const tableData = allRows.map((row, ri) =>
    row.map((cell, ci) => ({
      text: cell,
      options: {
        fontSize: 11,
        fontFace: 'Arial',
        bold: ri === 0,
        color: ri === 0 ? C.white : C.dark,
        fill: { color: ri === 0 ? C.primary : (ri % 2 === 0 ? C.light : C.white) },
        align: ['left', 'center', 'center', 'center'][ci] || 'center',
      }
    }))
  );
  slide.addTable(tableData, {
    x: 0.5, y: 1.0, w: 9.0,
    colW: header.length === 4 ? [2.0, 1.8, 2.2, 3.0] : undefined,
    rowH: 0.4,
    border: { type: 'none' },
    margin: [4, 6, 4, 6],
  });
  return slide;
}

// ─────────────── SLIDES ───────────────
const TOTAL = 36;

// 1 - Cover
{
  const slide = pptx.addSlide();
  slide.background = { fill: C.dark };
  slide.addText('Java 核心技术精讲', {
    x: 0.5, y: 1.2, w: 9.5, h: 1.2,
    fontSize: 40, bold: true, color: C.white, fontFace: 'Arial',
  });
  slide.addText('从入门到进阶', {
    x: 0.5, y: 2.4, w: 9.5, h: 0.8,
    fontSize: 22, color: C.secondary, fontFace: 'Arial',
  });
  slide.addShape(pptx.ShapeType.rect, {
    x: 0.5, y: 3.3, w: 3.5, h: 0.05, fill: { color: C.primary },
  });
  slide.addText('讲师：Claw  |  2026年5月', {
    x: 0.5, y: 3.6, w: 9.5, h: 0.5,
    fontSize: 14, color: C.gray, fontFace: 'Arial',
  });
  addSlideNum(slide, 1, TOTAL);
}

// 2 - TOC
{
  const slide = pptx.addSlide();
  slide.background = { fill: C.white };
  slide.addText('目  录', {
    x: 0.5, y: 0.25, w: 9.0, h: 0.6,
    fontSize: 20, bold: true, color: C.dark, fontFace: 'Arial',
  });
  slide.addShape(pptx.ShapeType.rect, {
    x: 0.5, y: 0.85, w: 2.5, h: 0.04, fill: { color: C.primary },
  });
  const tocItems = [
    'Java 概述与发展', '环境搭建与开发工具', '基础语法速览',
    '面向对象核心', '异常处理机制', '集合框架',
    '泛型与枚举', '多线程与并发', '输入输出（IO/NIO）',
    'JDBC 数据库编程', '新特性一览（Java 8~17）', '总结与学习资源',
  ];
  const leftCol = tocItems.slice(0, 6).map((t, i) => ({
    text: `  ${i + 1}. ${t}`,
    options: { fontSize: 13, color: C.dark, fontFace: 'Arial', bullet: false },
  }));
  const rightCol = tocItems.slice(6).map((t, i) => ({
    text: `  ${i + 7}. ${t}`,
    options: { fontSize: 13, color: C.dark, fontFace: 'Arial', bullet: false },
  }));
  slide.addText(leftCol, {
    x: 0.5, y: 1.2, w: 4.5, h: 3.5, valign: 'top', lineSpacingMultiple: 1.8,
  });
  slide.addText(rightCol, {
    x: 5.2, y: 1.2, w: 4.5, h: 3.5, valign: 'top', lineSpacingMultiple: 1.8,
  });
  addSlideNum(slide, 2, TOTAL);
}

// 3 - Java 概述
{
  const slide = contentSlide('Java 概述', [
    'Java 诞生于 1995 年，由 Sun Microsystems 开发',
    '三大平台：',
    { text: '   • Java SE（标准版）—— 桌面/基础应用', options: { bullet: false, fontSize: 13, color: C.dark, fontFace: 'Arial' } },
    { text: '   • Java EE（企业版）—— Web/企业应用', options: { bullet: false, fontSize: 13, color: C.dark, fontFace: 'Arial' } },
    { text: '   • Java ME（微型版）—— 嵌入式/移动设备', options: { bullet: false, fontSize: 13, color: C.dark, fontFace: 'Arial' } },
    '"一次编写，到处运行" —— JVM 字节码机制',
    '主要应用领域：Web后端、大数据、Android、嵌入式',
  ]);
  addSlideNum(slide, 3, TOTAL);
}

// 4 - Java 语言特性
{
  const slide = contentSlide('Java 语言特性', [
    '面向对象 —— 封装、继承、多态',
    '健壮性 —— 强类型、异常处理、自动内存管理（GC）',
    '跨平台 —— JVM 屏蔽操作系统差异',
    '多线程 —— 内置多线程支持，丰富的并发工具',
    '安全性 —— 类加载机制、字节码校验、安全沙箱',
  ]);
  addSlideNum(slide, 4, TOTAL);
}

// 5 - 环境搭建
{
  const slide = contentSlide('环境搭建', [
    'JDK（开发工具包）⊃ JRE（运行环境）⊃ JVM（虚拟机）',
    '推荐 JDK 17 LTS —— 下载自 Oracle / Adoptium',
    '配置环境变量：',
    { text: '   JAVA_HOME = C:\\Program Files\\Java\\jdk-17', options: { bullet: false, fontSize: 12, color: C.gray, fontFace: 'Courier New' } },
    { text: '   Path 中添加 %JAVA_HOME%\\bin', options: { bullet: false, fontSize: 12, color: C.gray, fontFace: 'Courier New' } },
    '验证安装：java -version / javac -version',
    '推荐 IDE：IntelliJ IDEA、Eclipse、VS Code',
  ]);
  addSlideNum(slide, 5, TOTAL);
}

// 6 - 第一个程序
codeSlide('第一个 Java 程序', 
`public class HelloWorld {
    public static void main(String[] args) {
        System.out.println("Hello, Java!");
    }
}`);

// 7 - 基础语法 (1)
{
  const slide = contentSlide('基础语法速览（1）', [
    '标识符规则：字母、数字、_、$，不能数字开头，驼峰命名',
    '变量与常量：final 关键字定义常量',
    '基本数据类型（8种）：',
    { text: '   整型：byte, short, int, long', options: { bullet: false, fontSize: 12, color: C.dark, fontFace: 'Courier New' } },
    { text: '   浮点：float, double', options: { bullet: false, fontSize: 12, color: C.dark, fontFace: 'Courier New' } },
    { text: '   字符：char  |  布尔：boolean', options: { bullet: false, fontSize: 12, color: C.dark, fontFace: 'Courier New' } },
    '引用数据类型：类、接口、数组',
  ]);
  addSlideNum(slide, 7, TOTAL);
}

// 8 - 基础语法 (2)
{
  const slide = contentSlide('基础语法速览（2）', [
    '运算符：算术、关系、逻辑、位、赋值、三元（?:）',
    '条件控制：if-else、switch（支持 String / 表达式）',
    '循环控制：for、while、do-while',
    '跳转语句：break、continue、return',
  ]);
  addSlideNum(slide, 8, TOTAL);
}

// 9 - 类与对象
{
  const slide = contentSlide('面向对象 —— 类与对象', [
    '类的定义：成员变量 + 方法',
    '对象的创建：new 关键字',
    '构造方法：默认构造、有参构造、构造重载',
    'this 关键字：指代当前对象，区分同名变量',
  ]);
  addSlideNum(slide, 9, TOTAL);
}

// 10 - 封装
{
  const slide = contentSlide('面向对象 —— 封装', [
    '访问修饰符：',
    { text: '   private（本类） < default（同包） < protected（子类） < public（任意）', options: { bullet: false, fontSize: 12, color: C.dark, fontFace: 'Arial' } },
    '通过 getter / setter 暴露属性',
    '好处：信息隐藏、数据校验、提高可维护性',
  ]);
  addSlideNum(slide, 10, TOTAL);
}

// 11 - 继承
{
  const slide = contentSlide('面向对象 —— 继承', [
    '继承语法：class A extends B',
    '方法重写（@Override）：子类重新定义父类方法',
    'super 关键字：调用父类构造器 / 父类方法',
    'Java 单继承：一个子类只能有一个直接父类',
    '优点：代码复用；缺点：继承层次过深增加复杂性',
  ]);
  addSlideNum(slide, 11, TOTAL);
}

// 12 - 多态
{
  const slide = contentSlide('面向对象 —— 多态', [
    '多态三要素：继承 + 重写 + 父类引用指向子类对象',
    '向上转型：父类引用自动指向子类对象',
    '向下转型：需使用 instanceof 判断避免 ClassCastException',
    '好处：提高可扩展性、降低耦合',
  ]);
  addSlideNum(slide, 12, TOTAL);
}

// 13 - 抽象类与接口
{
  const slide = contentSlide('抽象类与接口', [
    '抽象类（abstract class）：',
    { text: '   不能实例化，可包含抽象方法和具体方法', options: { bullet: false, fontSize: 12, color: C.dark, fontFace: 'Arial' } },
    '接口（interface）：',
    { text: '   方法默认 public abstract（Java 8+ 支持 default / static 方法）', options: { bullet: false, fontSize: 12, color: C.dark, fontFace: 'Arial' } },
    '多实现（implements） vs 单继承（extends）',
    '选择：描述"是什么"用抽象类，"能做什么"用接口',
  ]);
  addSlideNum(slide, 13, TOTAL);
}

// 14 - 异常处理
{
  const slide = contentSlide('异常处理机制', [
    '异常体系：Throwable → Exception（检查型/非检查型） & Error',
    'try-catch-finally：捕获并处理异常',
    'throws：声明方法可能抛出的异常',
    'throw：手动抛出异常对象',
    '自定义异常：继承 Exception（检查型）或 RuntimeException',
  ]);
  addSlideNum(slide, 14, TOTAL);
}

// 15 - 集合总览
{
  const slide = contentSlide('集合框架总览', [
    { text: 'Collection 接口体系：', options: { bold: true, fontSize: 14, color: C.dark, fontFace: 'Arial', bullet: false } },
    { text: '   ├── List（ArrayList, LinkedList, Vector）', options: { bullet: false, fontSize: 12, color: C.dark, fontFace: 'Courier New' } },
    { text: '   ├── Set（HashSet, TreeSet, LinkedHashSet）', options: { bullet: false, fontSize: 12, color: C.dark, fontFace: 'Courier New' } },
    { text: '   └── Queue（PriorityQueue, ArrayDeque）', options: { bullet: false, fontSize: 12, color: C.dark, fontFace: 'Courier New' } },
    { text: 'Map（HashMap, TreeMap, LinkedHashMap, Hashtable）', options: { bold: true, fontSize: 14, color: C.dark, fontFace: 'Arial', bullet: false } },
    '迭代器 Iterator 和 for-each 遍历方式',
  ]);
  addSlideNum(slide, 15, TOTAL);
}

// 16 - 集合对比表
tableSlide('常用集合对比',
  ['接口', '实现类', '是否有序', '底层结构'],
  [
    ['List', 'ArrayList', '是', '动态数组'],
    ['List', 'LinkedList', '是', '双向链表'],
    ['Set', 'HashSet', '否', '哈希表'],
    ['Set', 'TreeSet', '是（红黑树）', '红黑树'],
    ['Map', 'HashMap', '否', '哈希表+红黑树'],
  ]
);

// 17 - 泛型
{
  const slide = contentSlide('泛型', [
    '为什么需要泛型：编译时类型安全，消除强制转换',
    '泛型类/接口：class Box<T> { }',
    '泛型方法：public <T> void show(T t)',
    '通配符：? extends T（上界） / ? super T（下界）',
    '类型擦除：泛型信息在运行时被擦除为原始类型',
  ]);
  addSlideNum(slide, 17, TOTAL);
}

// 18 - 枚举
{
  const slide = contentSlide('枚举（Enum）', [
    '定义：enum Color { RED, GREEN, BLUE }',
    '枚举可以有字段、构造方法、方法',
    '常用方法：values()、ordinal()、valueOf()',
    '枚举在 switch 中的使用（更安全）',
  ]);
  addSlideNum(slide, 18, TOTAL);
}

// 19 - 多线程基础
{
  const slide = contentSlide('多线程基础', [
    '进程 vs 线程：进程是资源分配单元，线程是 CPU 调度单元',
    '创建线程的两种方式：',
    { text: '   ① 继承 Thread 类，重写 run()', options: { bullet: false, fontSize: 12, color: C.dark, fontFace: 'Arial' } },
    { text: '   ② 实现 Runnable 接口（推荐，更灵活）', options: { bullet: false, fontSize: 12, color: C.dark, fontFace: 'Arial' } },
    '常用方法：start()、run()、sleep()、join()、yield()',
  ]);
  addSlideNum(slide, 19, TOTAL);
}

// 20 - 线程同步
{
  const slide = contentSlide('线程同步与锁', [
    '线程安全问题：多线程同时读写共享数据',
    'synchronized 关键字：同步方法 / 同步代码块',
    'Lock 接口：ReentrantLock 可重入锁',
    '死锁：多个线程互相等待对方释放锁',
    { text: '   避免：固定加锁顺序、使用 tryLock 超时', options: { bullet: false, fontSize: 12, color: C.gray, fontFace: 'Arial' } },
  ]);
  addSlideNum(slide, 20, TOTAL);
}

// 21 - 等待通知
{
  const slide = contentSlide('等待与通知机制', [
    'Object 类：wait()、notify()、notifyAll()',
    '必须在 synchronized 块中调用（否则抛出 IllegalMonitorStateException）',
    '经典场景：生产者-消费者模型',
    'wait() 释放锁，notify() 唤醒等待线程',
  ]);
  addSlideNum(slide, 21, TOTAL);
}

// 22 - JUC
{
  const slide = contentSlide('并发工具（JUC）', [
    '原子类：AtomicInteger、AtomicLong（CAS 无锁实现）',
    '线程池：ExecutorService、Executors（避免手动创建线程）',
    '并发集合：ConcurrentHashMap、CopyOnWriteArrayList',
    '同步工具：CountDownLatch、CyclicBarrier、Semaphore',
  ]);
  addSlideNum(slide, 22, TOTAL);
}

// 23 - IO
{
  const slide = contentSlide('输入输出（IO）', [
    'File 类：文件和目录的抽象表示',
    '字节流：InputStream / OutputStream',
    { text: '   FileInputStream, BufferedInputStream, DataInputStream', options: { bullet: false, fontSize: 11, color: C.gray, fontFace: 'Courier New' } },
    '字符流：Reader / Writer',
    { text: '   FileReader, BufferedReader, PrintWriter', options: { bullet: false, fontSize: 11, color: C.gray, fontFace: 'Courier New' } },
    '转换流：InputStreamReader / OutputStreamWriter',
  ]);
  addSlideNum(slide, 23, TOTAL);
}

// 24 - NIO
{
  const slide = contentSlide('NIO 简介', [
    '三大核心组件：Buffer（缓冲区）、Channel（通道）、Selector（选择器）',
    '非阻塞 I/O：一个线程可处理多个连接',
    '传统 IO vs NIO：面向流 vs 面向缓冲区，阻塞 vs 非阻塞',
    'Files 工具类：walk()、list()、readString()、writeString()',
  ]);
  addSlideNum(slide, 24, TOTAL);
}

// 25 - JDBC
{
  const slide = contentSlide('JDBC 编程步骤', [
    '① 加载驱动：Class.forName("com.mysql.cj.jdbc.Driver")',
    '② 获取连接：DriverManager.getConnection(url, user, pass)',
    '③ 创建 PreparedStatement（防 SQL 注入）',
    '④ 执行：executeQuery() / executeUpdate()',
    '⑤ 处理结果集（ResultSet）',
    '⑥ 关闭资源（try-with-resources 自动关闭）',
  ]);
  addSlideNum(slide, 25, TOTAL);
}

// 26 - JDBC 事务
{
  const slide = contentSlide('JDBC 事务管理', [
    '关闭自动提交：conn.setAutoCommit(false)',
    '提交事务：conn.commit()',
    '回滚事务：conn.rollback()',
    '保存点：conn.setSavepoint() —— 部分回滚',
  ]);
  addSlideNum(slide, 26, TOTAL);
}

// 27 - Java 8
{
  const slide = contentSlide('Java 8 新特性', [
    'Lambda 表达式：(param) -> expression',
    '函数式接口：@FunctionalInterface（如 Consumer, Predicate）',
    'Stream API：filter、map、collect、reduce、flatMap',
    '方法引用：Class::staticMethod',
    'Optional 容器类：优雅处理空指针',
  ]);
  addSlideNum(slide, 27, TOTAL);
}

// 28 - Java 9~17
tableSlide('Java 9~17 重要新特性',
  ['版本', '特性', '说明'],
  [
    ['Java 9', '模块化（JPMS）', 'module-info.java 定义模块依赖'],
    ['Java 9', 'JShell', '交互式 REPL 工具'],
    ['Java 10', 'var 局部变量', '类型推断简化代码'],
    ['Java 11', 'HTTP Client', '标准化的 HTTP/2 客户端'],
    ['Java 14', 'Records', '简洁的数据载体类'],
    ['Java 14', 'instanceof 模式匹配', '简化类型检查与转换'],
    ['Java 17', '密封类（sealed）', '限定继承范围'],
    ['Java 17', '文本块', '多行字符串字面量'],
  ]
);

// 29 - 工具链
{
  const slide = contentSlide('常用开发工具与构建工具', [
    '版本控制：Git + GitHub / GitLab',
    '构建工具：Maven（pom.xml） / Gradle（build.gradle）',
    '日志框架：SLF4J + Logback',
    '单元测试：JUnit 5（@Test, @BeforeEach, @ParameterizedTest）',
  ]);
  addSlideNum(slide, 29, TOTAL);
}

// 30 - JMM
{
  const slide = contentSlide('Java 内存模型（JMM）', [
    '堆（Heap）：存放对象实例，GC 主要区域',
    '栈（Stack）：存放局部变量、方法调用帧',
    '方法区（元空间）：类信息、静态变量、常量池',
    '程序计数器：线程私有，指向当前执行的字节码指令',
    '本地方法栈：支持 native 方法调用',
  ]);
  addSlideNum(slide, 30, TOTAL);
}

// 31 - GC
{
  const slide = contentSlide('垃圾回收（GC）简介', [
    '判断对象存活：引用计数（循环引用缺陷） vs 可达性分析（GC Roots）',
    '回收算法：标记-清除、复制、标记-整理、分代收集',
    '常用收集器：',
    { text: '   Serial → Parallel → CMS → G1（默认） → ZGC（低延迟）', options: { bullet: false, fontSize: 12, color: C.dark, fontFace: 'Arial' } },
  ]);
  addSlideNum(slide, 31, TOTAL);
}

// 32 - 反射
{
  const slide = contentSlide('反射机制', [
    '获取 Class 对象：Class.forName() / 类名.class / 对象.getClass()',
    '动态创建实例：clazz.getConstructor().newInstance()',
    '访问私有成员：setAccessible(true)',
    '优缺点：灵活性强，但性能较低，破坏封装',
  ]);
  addSlideNum(slide, 32, TOTAL);
}

// 33 - 注解
{
  const slide = contentSlide('注解（Annotation）', [
    '内置注解：@Override、@Deprecated、@SuppressWarnings',
    '元注解：@Target、@Retention、@Documented、@Inherited',
    '自定义注解：@interface 定义',
    '通过反射读取运行时注解（RetentionPolicy.RUNTIME）',
  ]);
  addSlideNum(slide, 33, TOTAL);
}

// 34 - 最佳实践
{
  const slide = contentSlide('最佳实践与编码规范', [
    '参考《阿里巴巴 Java 开发手册》（命名、注释、格式）',
    '避免使用过时 API（@Deprecated 标记的类/方法）',
    '优先使用 try-with-resources 管理资源',
    '集合初始化指定容量，减少扩容开销',
    '字符串拼接使用 StringBuilder 代替 +=' ,
    '遵循单一职责、开闭原则等设计原则',
  ]);
  addSlideNum(slide, 34, TOTAL);
}

// 35 - 总结
{
  const slide = contentSlide('总  结', [
    'Java 仍然是企业级开发的基石',
    '掌握核心 API（集合、多线程、IO）是基本要求',
    '不断跟进新版本特性（Lambda、Stream、Records）',
    '推荐学习路径：',
    { text: '   Java 基础 → 设计模式 → JVM 优化 → Spring 框架', options: { bullet: false, fontSize: 13, color: C.primary, fontFace: 'Arial' } },
  ]);
  addSlideNum(slide, 35, TOTAL);
}

// 36 - Q&A
{
  const slide = pptx.addSlide();
  slide.background = { fill: C.dark };
  slide.addText('Q & A', {
    x: 0.5, y: 1.5, w: 9.5, h: 1.0,
    fontSize: 44, bold: true, color: C.white, fontFace: 'Arial', align: 'center',
  });
  slide.addText('互动答疑', {
    x: 0.5, y: 2.6, w: 9.5, h: 0.6,
    fontSize: 20, color: C.secondary, fontFace: 'Arial', align: 'center',
  });
  slide.addShape(pptx.ShapeType.rect, {
    x: 3.5, y: 3.5, w: 3.0, h: 0.04, fill: { color: C.primary },
  });
  slide.addText('联系方式 | GitHub | Blog', {
    x: 0.5, y: 4.0, w: 9.5, h: 0.5,
    fontSize: 12, color: C.gray, fontFace: 'Arial', align: 'center',
  });
  addSlideNum(slide, 36, TOTAL);
}

// ─── Save ───
const outPath = '/home/hsx/.openclaw/workspace/Java核心技术精讲.pptx';
await pptx.writeFile({ fileName: outPath });
console.log(`✅ PPT saved: ${outPath}`);
console.log(`   ${TOTAL} slides`);
