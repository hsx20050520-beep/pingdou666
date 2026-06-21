import PptxGenJS from 'pptxgenjs';
import fs from 'fs';
import { execSync } from 'child_process';

// ─── Color Palette ───
const C = {
  primary:    '2563EB',   // blue-600
  primaryLight: '93C5FD', // blue-300
  primaryDark: '1E40AF',  // blue-800
  secondary:  '059669',   // emerald-600
  accent:     'DC2626',   // red-600
  gold:       'D97706',   // amber-600
  purple:     '7C3AED',   // violet-600
  dark:       '111827',   // gray-900
  dark2:      '1F2937',   // gray-800
  gray:       '6B7280',   // gray-500
  grayLight:  'E5E7EB',   // gray-200
  light:      'F3F4F6',   // gray-100
  white:      'FFFFFF',
  codeBg:     '1E1E2E',
  codeFg:     'CDD6F4',
  codeGreen:  'A6E3A1',
  codeBlue:   '89B4FA',
  codeYellow: 'F9E2AF',
};

const pptx = new PptxGenJS();
pptx.layout = 'LAYOUT_WIDE';
pptx.author = 'Claw';
pptx.title = 'Java 核心技术精讲';
pptx.subject = 'Java核心技术培训PPT';

// ─── Helpers ───
function addFooter(slide, num, total) {
  // decorative bottom bar
  slide.addShape(pptx.ShapeType.rect, {
    x: 0, y: 5.3, w: 10, h: 0.05, fill: { color: C.primary },
  });
  slide.addText(`${num} / ${total}`, {
    x: 8.6, y: 5.4, w: 1.3, h: 0.3,
    fontSize: 8, color: C.gray, align: 'right', fontFace: 'Arial',
  });
}

function roundedBox(slide, x, y, w, h, fillColor, opts = {}) {
  slide.addShape(pptx.ShapeType.roundRect, {
    x, y, w, h,
    fill: { color: fillColor },
    shadow: { type: 'outer', blur: 4, offset: 1, color: '000000', opacity: 0.1 },
    rectRadius: 0.08,
    ...opts,
  });
}

// ─── Slide Builder ───
const TOTAL = 36;

// ========== SLIDE 1: COVER ==========
{
  const s = pptx.addSlide();
  // Full gradient bg
  s.background = { fill: C.dark };
  // Accent bar
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 0.12, h: 5.4, fill: { color: C.primary } });
  // Subtle top-right decorative circle
  s.addShape(pptx.ShapeType.ellipse, { x: 7.5, y: -0.8, w: 3, h: 3, fill: { color: C.primary, transparency: 85 } });
  s.addShape(pptx.ShapeType.ellipse, { x: 8.0, y: -0.3, w: 2, h: 2, fill: { color: C.secondary, transparency: 85 } });
  // Title
  s.addText('Java 核心技术', {
    x: 0.8, y: 1.0, w: 8, h: 1.0,
    fontSize: 42, bold: true, color: C.white, fontFace: 'Arial',
  });
  s.addText('精  讲', {
    x: 0.8, y: 1.85, w: 8, h: 0.9,
    fontSize: 38, bold: true, color: C.primaryLight, fontFace: 'Arial',
  });
  // Underline bar
  s.addShape(pptx.ShapeType.rect, { x: 0.8, y: 2.85, w: 4, h: 0.05, fill: { color: C.primary } });
  // Subtitle
  s.addText('从入门到进阶', {
    x: 0.8, y: 3.1, w: 8, h: 0.6,
    fontSize: 18, color: C.gray, fontFace: 'Arial',
  });
  // Bottom info
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 5.0, w: 10, h: 0.4, fill: { color: C.dark2 } });
  s.addText('讲师：Claw  |  2026年5月  |  Java核心技术培训', {
    x: 0.8, y: 5.0, w: 8.5, h: 0.4,
    fontSize: 10, color: C.gray, fontFace: 'Arial',
  });
}

// ========== SLIDE 2: TOC ==========
{
  const s = pptx.addSlide();
  s.background = { fill: C.white };
  // Left accent bar
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 0.08, h: 5.4, fill: { color: C.primary } });
  // Header
  s.addText('目  录', {
    x: 0.6, y: 0.3, w: 3, h: 0.6,
    fontSize: 24, bold: true, color: C.dark, fontFace: 'Arial',
  });
  s.addShape(pptx.ShapeType.rect, { x: 0.6, y: 0.9, w: 1.5, h: 0.04, fill: { color: C.primary } });
  // Section label
  s.addText('CONTENTS', {
    x: 0.6, y: 1.0, w: 3, h: 0.3,
    fontSize: 9, color: C.gray, fontFace: 'Arial', letterSpacing: 2,
  });

  const tocLeft = [
    'Java 概述与发展',
    '环境搭建与开发工具',
    '基础语法速览',
    '面向对象核心',
    '异常处理机制',
    '集合框架',
  ];
  const tocRight = [
    '泛型与枚举',
    '多线程与并发',
    '输入输出（IO/NIO）',
    'JDBC 数据库编程',
    '新特性一览（Java 8~17）',
    '总结与学习资源',
  ];

  const makeTocItems = (items, startIdx) => items.map((t, i) => ({
    text: `  ${startIdx + i}.  ${t}`,
    options: { fontSize: 12, color: C.dark, fontFace: 'Arial', bullet: false },
  }));

  s.addText(makeTocItems(tocLeft, 1), {
    x: 0.6, y: 1.5, w: 4.2, h: 3.5, valign: 'top', lineSpacingMultiple: 1.8,
  });
  s.addText(makeTocItems(tocRight, 7), {
    x: 5.2, y: 1.5, w: 4.2, h: 3.5, valign: 'top', lineSpacingMultiple: 1.8,
  });

  // Vertical divider
  s.addShape(pptx.ShapeType.rect, { x: 5.0, y: 1.5, w: 0.02, h: 3.2, fill: { color: C.grayLight } });
  addFooter(s, 2, TOTAL);
}

// ========== SLIDES 3-34: Content ==========

function makeSectionSlide(title, subtitle, items, num) {
  const s = pptx.addSlide();
  s.background = { fill: C.light };
  // Top color block
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 10, h: 2.2, fill: { color: C.dark } });
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 2.2, w: 10, h: 0.06, fill: { color: C.primary } });
  // Title
  s.addText(title, {
    x: 0.6, y: 0.5, w: 8.8, h: 0.7,
    fontSize: 22, bold: true, color: C.white, fontFace: 'Arial',
  });
  if (subtitle) {
    s.addText(subtitle, {
      x: 0.6, y: 1.2, w: 8.8, h: 0.4,
      fontSize: 11, color: C.gray, fontFace: 'Arial',
    });
  }
  // Content items
  const textItems = items.map(item => {
    if (typeof item === 'string') return { text: item, options: { bullet: true, fontSize: 13, fontFace: 'Arial', color: C.dark } };
    return item;
  });
  s.addText(textItems, {
    x: 0.6, y: 2.6, w: 8.8, h: 2.5,
    valign: 'top', lineSpacingMultiple: 1.6,
  });
  addFooter(s, num, TOTAL);
  return s;
}

function makeCodeSlide(title, code, num, desc) {
  const s = pptx.addSlide();
  s.background = { fill: C.light };
  // Header
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 10, h: 1.0, fill: { color: C.dark } });
  s.addText(title, {
    x: 0.6, y: 0.2, w: 8.8, h: 0.6,
    fontSize: 20, bold: true, color: C.white, fontFace: 'Arial',
  });
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 1.0, w: 10, h: 0.04, fill: { color: C.primary } });
  // Code block
  const codeLines = code.split('\n').map(line => ({
    text: line,
    options: { bullet: false, fontSize: 10, fontFace: 'Courier New', color: C.codeFg, breakType: 'none' },
  }));
  const codeH = Math.min(codeLines.length * 0.22 + 0.3, 3.8);
  roundedBox(s, 0.6, 1.3, 8.8, codeH, C.codeBg);
  s.addText(codeLines, {
    x: 0.8, y: 1.4, w: 8.4, h: codeH - 0.2,
    valign: 'top', lineSpacingMultiple: 1.1,
  });
  // Description
  if (desc) {
    s.addText(desc, {
      x: 0.6, y: 1.3 + codeH + 0.15, w: 8.8, h: 0.7,
      fontSize: 11, color: C.gray, fontFace: 'Arial', italic: true,
    });
  }
  addFooter(s, num, TOTAL);
  return s;
}

function makeTableSlide(title, headers, rows, num) {
  const s = pptx.addSlide();
  s.background = { fill: C.light };
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 10, h: 1.0, fill: { color: C.dark } });
  s.addText(title, {
    x: 0.6, y: 0.2, w: 8.8, h: 0.6,
    fontSize: 20, bold: true, color: C.white, fontFace: 'Arial',
  });
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 1.0, w: 10, h: 0.04, fill: { color: C.primary } });

  const allRows = [headers, ...rows];
  const tableData = allRows.map((row, ri) =>
    row.map((cell, ci) => ({
      text: cell,
      options: {
        fontSize: ri === 0 ? 11 : 10,
        fontFace: 'Arial',
        bold: ri === 0,
        color: ri === 0 ? C.white : C.dark,
        fill: { color: ri === 0 ? C.primary : (ri % 2 === 0 ? C.light : C.white) },
        align: ci === 0 ? 'left' : 'center',
      },
    }))
  );

  const colCount = headers.length;
  let colW = colCount === 4 ? [2.2, 2.2, 2.2, 2.2] :
             colCount === 3 ? [1.5, 2.5, 4.8] :
             colCount === 2 ? [3, 6] : undefined;

  s.addTable(tableData, {
    x: 0.6, y: 1.4, w: 8.8,
    colW: colW,
    rowH: 0.38,
    border: { type: 'none' },
    margin: [3, 8, 3, 8],
  });
  addFooter(s, num, TOTAL);
  return s;
}

// Content slides data
const slides = [
  // 3
  { type: 'content', title: 'Java 概述', items: [
    'Java 诞生于 1995 年，由 Sun Microsystems 开发',
    '三大平台：Java SE（标准版） / Java EE（企业版） / Java ME（微型版）',
    '核心理念 —— "一次编写，到处运行"（Write Once, Run Anywhere）',
    '基于 JVM 的字节码机制，屏蔽操作系统差异',
    '主要应用领域：Web后端、大数据（Hadoop/Spark）、Android、嵌入式系统',
  ]},
  // 4
  { type: 'content', title: 'Java 语言特性', items: [
    '面向对象 —— 封装、继承、多态，三大支柱',
    '健壮性 —— 强类型检查、完善的异常处理、自动垃圾回收（GC）',
    '跨平台 —— JVM 屏蔽操作系统差异，字节码一次编译到处运行',
    '多线程 —— 内置多线程支持，提供丰富的并发工具（JUC）',
    '安全性 —— 类加载机制、字节码校验、安全管理器与沙箱模型',
  ]},
  // 5
  { type: 'content', title: '环境搭建', items: [
    'JDK（开发工具包） ⊃  JRE（运行环境） ⊃  JVM（虚拟机）',
    '推荐 JDK 17 LTS —— 下载自 Oracle 或 Adoptium / OpenJDK',
    '配置环境变量：JAVA_HOME 与 Path 路径',
    { text: '   验证：java -version    javac -version', options: { bullet: false, fontSize: 12, fontFace: 'Courier New', color: C.codeBg } },
    '推荐 IDE：IntelliJ IDEA（首选）、Eclipse、VS Code',
  ]},
];

// 6 - Code: Hello World
makeCodeSlide('第一个 Java 程序',
`public class HelloWorld {
    public static void main(String[] args) {
        System.out.println("Hello, Java!");
    }
}`, 6, '编译：javac HelloWorld.java  →  运行：java HelloWorld');

// 7
makeSectionSlide('基础语法速览（1）', 'Variables · Data Types · Constants', [
  '标识符规则：字母/数字/_,$ 组成，不能数字开头，遵循驼峰命名',
  '变量与常量：final 关键字定义不可变常量',
  '基本数据类型（8种）：',
  { text: '   整型 byte/short/int/long  |  浮点 float/double  |  字符 char  |  布尔 boolean', options: { bullet: false, fontSize: 12, fontFace: 'Courier New', color: C.codeBg } },
  '引用数据类型：类（Class）、接口（Interface）、数组（Array）',
], 7);

// 8
makeSectionSlide('基础语法速览（2）', 'Operators · Control Flow', [
  '运算符：算术、关系、逻辑、位运算、赋值、三元（?:）',
  '条件控制：if-else 、 switch（支持 String 和表达式）',
  '循环控制：for（含增强for）、while、do-while',
  '跳转语句：break、continue、return',
], 8);

// 9
makeSectionSlide('面向对象 —— 类与对象', 'Class · Object · Constructor', [
  '类的定义：成员变量（字段） + 成员方法',
  '对象的创建：new 关键字调用构造方法',
  '构造方法：默认构造、有参构造、构造方法重载',
  'this 关键字：指代当前对象，区分成员变量与局部变量',
], 9);

// 10
makeSectionSlide('面向对象 —— 封装', 'Encapsulation · Access Modifiers', [
  '访问修饰符（控制可见范围）：',
  { text: '   private（本类）< default（同包）< protected（子类）< public（任意）', options: { bullet: false, fontSize: 11, fontFace: 'Arial', color: C.dark } },
  '通过 getter / setter 方法暴露属性访问',
  '好处：信息隐藏、数据校验、提高可维护性和降低耦合',
], 10);

// 11
makeSectionSlide('面向对象 —— 继承', 'Inheritance · Override · super', [
  '继承语法：class A extends B',
  '方法重写（@Override）：子类重新定义父类方法实现',
  'super 关键字：调用父类构造器或父类被重写的方法',
  'Java 单继承限制：一个子类只能有一个直接父类',
  '优点：代码复用；缺点：层次过深增加维护复杂度',
], 11);

// 12
makeSectionSlide('面向对象 —— 多态', 'Polymorphism · Upcasting · Downcasting', [
  '多态三要素：继承 + 方法重写 + 父类引用指向子类对象',
  '向上转型：父类引用自动指向子类对象（安全）',
  '向下转型：需使用 instanceof 判断类型，避免 ClassCastException',
  '好处：提高可扩展性、降低模块间耦合',
], 12);

// 13
makeSectionSlide('抽象类与接口', 'Abstract Class · Interface', [
  '抽象类（abstract class）：不能实例化，可包含抽象和具体方法',
  '接口（interface）：方法默认 public abstract（Java 8+ 支持 default/static 方法）',
  '多实现（implements 多个接口） vs 单继承（extends 一个类）',
  '选择原则：描述"是什么"用抽象类，"能做什么"用接口',
], 13);

// 14
makeSectionSlide('异常处理机制', 'Exception Hierarchy · try-catch · Custom Exception', [
  '异常体系：Throwable  →  Exception（检查/非检查型） / Error（不可恢复）',
  '异常处理：try-catch-finally 捕获并处理',
  'throws 声明异常  /  throw 手动抛出异常对象',
  '自定义异常：继承 Exception（检查型）或 RuntimeException（非检查型）',
], 14);

// 15
makeSectionSlide('集合框架总览', 'Collection Framework · List · Set · Map', [
  { text: 'Collection 体系：', options: { bold: true, bullet: false, fontSize: 13, fontFace: 'Arial', color: C.dark } },
  { text: '   ├── List（ArrayList, LinkedList, Vector）', options: { bullet: false, fontSize: 11, fontFace: 'Courier New', color: C.codeBg } },
  { text: '   ├── Set（HashSet, TreeSet, LinkedHashSet）', options: { bullet: false, fontSize: 11, fontFace: 'Courier New', color: C.codeBg } },
  { text: '   └── Queue（PriorityQueue, ArrayDeque）', options: { bullet: false, fontSize: 11, fontFace: 'Courier New', color: C.codeBg } },
  { text: 'Map 体系：HashMap, TreeMap, LinkedHashMap, Hashtable', options: { bold: true, bullet: false, fontSize: 13, fontFace: 'Arial', color: C.dark } },
  '迭代器 Iterator 与 for-each 遍历',
], 15);

// 16
makeTableSlide('常用集合对比',
  ['接口', '实现类', '是否有序', '底层结构'],
  [
    ['List', 'ArrayList', '是（插入顺序）', '动态数组'],
    ['List', 'LinkedList', '是（插入顺序）', '双向链表'],
    ['Set', 'HashSet', '否', '哈希表（HashMap）'],
    ['Set', 'TreeSet', '是（红黑树排序）', '红黑树（TreeMap）'],
    ['Map', 'HashMap', '否', '哈希表 + 红黑树'],
  ], 16);

// 17
makeSectionSlide('泛型', 'Generics · Type Safety · Wildcards', [
  '为什么需要泛型：编译时类型安全，消除类型强制转换',
  '泛型类/接口：class Box<T> { }',
  '泛型方法：public <T> void show(T t)',
  '通配符：? extends T（上界通配） / ? super T（下界通配）',
  '类型擦除：泛型信息在运行时被擦除为原始类型（Raw Type）',
], 17);

// 18
makeSectionSlide('枚举（Enum）', 'Enum Type · Constants · Methods', [
  '定义一组常量：enum Color { RED, GREEN, BLUE }',
  '枚举类可以有字段、构造方法、普通方法',
  '常用方法：values()、ordinal()、valueOf()',
  '枚举在 switch 中的使用 —— 更安全、更清晰',
], 18);

// 19
makeSectionSlide('多线程基础', 'Thread · Runnable · Lifecycle', [
  '进程 vs 线程：进程是资源分配单元，线程是 CPU 调度执行单元',
  '创建线程的两种方式：',
  { text: '   ① 继承 Thread 类，重写 run() 方法', options: { bullet: false, fontSize: 12, fontFace: 'Arial', color: C.dark } },
  { text: '   ② 实现 Runnable 接口（推荐 —— 解耦，更灵活）', options: { bullet: false, fontSize: 12, fontFace: 'Arial', color: C.dark } },
  '常用方法：start()、run()、sleep()、join()、yield()',
], 19);

// 20
makeSectionSlide('线程同步与锁', 'Synchronized · Lock · Deadlock', [
  '线程安全问题：多线程同时读写共享数据（如：买票系统）',
  'synchronized 关键字：同步方法 / 同步代码块',
  'Lock 接口：ReentrantLock（可重入锁，更灵活）',
  '死锁：多个线程循环等待对方释放锁资源',
  { text: '   避免策略：固定加锁顺序、使用 tryLock 超时', options: { bullet: false, fontSize: 11, fontFace: 'Arial', color: C.gray } },
], 20);

// 21
makeSectionSlide('等待与通知机制', 'wait() · notify() · Producer-Consumer', [
  'Object 类提供的线程协作方法：wait()、notify()、notifyAll()',
  '必须在 synchronized 块中调用（否则抛出 IllegalMonitorStateException）',
  '经典场景：生产者-消费者模型（缓冲区满则等待，空则唤醒）',
  'wait() 释放锁进入等待；notify() 随机唤醒一个等待线程',
], 21);

// 22
makeSectionSlide('并发工具（JUC）', 'J.U.C · Atomic · ThreadPool · Concurrent Collections', [
  '原子类：AtomicInteger、AtomicLong（基于 CAS 无锁实现）',
  '线程池：ExecutorService、Executors（避免频繁创建/销毁线程）',
  '并发集合：ConcurrentHashMap、CopyOnWriteArrayList',
  '同步工具：CountDownLatch、CyclicBarrier、Semaphore',
], 22);

// 23
makeSectionSlide('输入输出（IO）', 'Stream · Reader/Writer · File', [
  'File 类：文件和目录路径的抽象表示',
  '字节流：InputStream / OutputStream',
  { text: '   FileInputStream, BufferedInputStream, DataInputStream', options: { bullet: false, fontSize: 11, fontFace: 'Courier New', color: C.gray } },
  '字符流：Reader / Writer（处理 Unicode 文本）',
  '转换流：InputStreamReader / OutputStreamWriter（字节 ↔ 字符）',
], 23);

// 24
makeSectionSlide('NIO 简介', 'Non-blocking IO · Buffer · Channel · Selector', [
  '三大核心：Buffer（缓冲区）、Channel（通道）、Selector（选择器）',
  '非阻塞 I/O：单线程可管理多个连接（适用于高并发网络）',
  '传统 IO vs NIO：面向流 vs 面向缓冲区，阻塞 vs 非阻塞',
  'Files 工具类：walk()、list()、readString()、writeString()',
], 24);

// 25
makeSectionSlide('JDBC 编程步骤', 'Driver · Connection · PreparedStatement · ResultSet', [
  '① 加载驱动：Class.forName("com.mysql.cj.jdbc.Driver")',
  '② 获取连接：DriverManager.getConnection(url, user, password)',
  '③ 创建 PreparedStatement —— 防止 SQL 注入',
  '④ 执行 SQL：executeQuery()（查询） / executeUpdate()（增删改）',
  '⑤ 处理结果集：ResultSet 遍历查询结果',
  '⑥ 关闭资源 —— 推荐 try-with-resources 自动释放',
], 25);

// 26
makeSectionSlide('JDBC 事务管理', 'Transaction · Commit · Rollback · Savepoint', [
  '关闭自动提交：conn.setAutoCommit(false)',
  '提交事务：conn.commit()',
  '回滚事务：conn.rollback()',
  '保存点：conn.setSavepoint() —— 实现部分回滚',
  '保证数据的一致性和完整性',
], 26);

// 27
makeSectionSlide('Java 8 新特性', 'Lambda · Stream · Optional · Method Reference', [
  'Lambda 表达式：(param) -> expression （简化匿名内部类）',
  '函数式接口：@FunctionalInterface —— Consumer、Predicate、Function',
  'Stream API：filter、map、collect、reduce、flatMap',
  '方法引用：Class::staticMethod （更简洁的 Lambda）',
  'Optional 容器类：优雅处理可能为 null 的值',
], 27);

// 28
makeTableSlide('Java 9~17 重要新特性',
  ['版本', '特性名称', '简要说明'],
  [
    ['Java 9', '模块化（JPMS）', 'module-info.java 定义模块依赖和导出'],
    ['Java 9', 'JShell 交互式 REPL', '命令行快速测试 Java 代码片段'],
    ['Java 10', '局部变量类型推断（var）', 'var list = new ArrayList<String>()'],
    ['Java 11 (LTS)', 'HTTP Client 标准化', 'java.net.http 支持 HTTP/2 和 WebSocket'],
    ['Java 14', 'Records（记录类）', '简洁的不可变数据载体：record Point(int x, int y)'],
    ['Java 17 (LTS)', '密封类（sealed）', 'sealed interface 限定实现类范围'],
    ['Java 17 (LTS)', '文本块（Text Blocks）', '""" 多行字符串字面量 """'],
  ], 28);

// 29
makeSectionSlide('常用开发工具与构建工具', 'Git · Maven · Gradle · JUnit', [
  '版本控制：Git + GitHub / GitLab 协作开发',
  '构建工具：Maven（pom.xml 依赖管理） / Gradle（Groovy/Kotlin DSL）',
  '日志框架：SLF4J + Logback（行业标准日志方案）',
  '单元测试：JUnit 5 —— @Test、@BeforeEach、@ParameterizedTest',
], 29);

// 30
makeSectionSlide('Java 内存模型（JMM）', 'Heap · Stack · Method Area · PC Register', [
  '堆（Heap）：存放对象实例，GC 回收的主要区域',
  '栈（Stack）：每个线程私有，存放局部变量、方法调用帧',
  '方法区（元空间 Metaspace）：类信息、静态变量、常量池',
  '程序计数器（PC Register）：线程私有，指向当前执行的字节码指令',
  '本地方法栈（Native Method Stack）：支持 native 方法调用',
], 30);

// 31
makeSectionSlide('垃圾回收（GC）简介', 'GC Roots · Algorithms · Collectors', [
  '判断对象存活：引用计数法（循环引用缺陷） vs 可达性分析（GC Roots）',
  '回收算法：标记-清除、复制、标记-整理、分代收集',
  '常用收集器演进：',
  { text: '   Serial（单线程）→ Parallel（并行）→ CMS（低延迟）→ G1（默认）→ ZGC（超低延迟）', options: { bullet: false, fontSize: 11, fontFace: 'Arial', color: C.dark } },
], 31);

// 32
makeSectionSlide('反射机制', 'Reflection · Class · Dynamic Invocation', [
  '获取 Class 对象的三种方式：Class.forName() / 类名.class / 对象.getClass()',
  '动态创建实例：clazz.getConstructor().newInstance()',
  '访问私有成员变量/方法：setAccessible(true)',
  '优缺点：提供灵活的动态能力，但性能较低，破坏封装性',
], 32);

// 33
makeSectionSlide('注解（Annotation）', 'Built-in · Meta · Custom · Reflection', [
  '内置注解：@Override、@Deprecated、@SuppressWarnings',
  '元注解：@Target（作用目标）、@Retention（生命周期）、@Documented、@Inherited',
  '自定义注解：使用 @interface 关键字定义',
  '通过反射读取运行时注解（RetentionPolicy.RUNTIME）',
], 33);

// 34
makeSectionSlide('最佳实践与编码规范', 'Best Practices · Code Style · Performance', [
  '参考《阿里巴巴 Java 开发手册》（命名、注释、代码格式）',
  '避免使用过时 API（查看 @Deprecated 标记）',
  '优先使用 try-with-resources 管理 IO 和数据库资源',
  '集合初始化时指定预期容量（减少扩容开销）',
  '字符串拼接使用 StringBuilder 代替 +=',
  '遵循单一职责、开闭原则等 SOLID 设计原则',
], 34);

// 35
makeSectionSlide('总  结', 'Summary · Learning Path', [
  'Java 仍然是企业级开发的基石，生态丰富',
  '掌握核心 API（集合、多线程、IO/NIO）是基本要求',
  '不断跟进新版本特性（Lambda、Stream、Records、密封类）',
  '推荐学习路径：',
  { text: '   Java 基础 → 设计模式 → JVM 优化 → Spring 生态', options: { bullet: false, fontSize: 14, fontFace: 'Arial', color: C.primary, bold: true } },
], 35);

// ========== SLIDE 36: Q&A ==========
{
  const s = pptx.addSlide();
  s.background = { fill: C.dark };
  // Decorative circles
  s.addShape(pptx.ShapeType.ellipse, { x: -1, y: -1, w: 4, h: 4, fill: { color: C.primary, transparency: 90 } });
  s.addShape(pptx.ShapeType.ellipse, { x: 7, y: 3, w: 4, h: 4, fill: { color: C.secondary, transparency: 90 } });
  // Main text
  s.addText('Q  &  A', {
    x: 0.5, y: 1.2, w: 9, h: 1.2,
    fontSize: 48, bold: true, color: C.white, fontFace: 'Arial', align: 'center',
  });
  s.addText('互动答疑', {
    x: 0.5, y: 2.5, w: 9, h: 0.6,
    fontSize: 20, color: C.secondary, fontFace: 'Arial', align: 'center',
  });
  s.addShape(pptx.ShapeType.rect, {
    x: 3.5, y: 3.4, w: 3, h: 0.04, fill: { color: C.primary },
  });
  s.addText('联系方式  |  GitHub  |  博客', {
    x: 0.5, y: 3.8, w: 9, h: 0.4,
    fontSize: 11, color: C.gray, fontFace: 'Arial', align: 'center',
  });
  addFooter(s, 36, TOTAL);
}

// ─── Save temporary PPTX ───
const tempPath = '/tmp/java-ppt-temp.pptx';
await pptx.writeFile({ fileName: tempPath });
console.log(`✅ Base PPT generated: ${tempPath}`);

// ─── Add transitions by modifying OOXML ───
console.log('📦 Adding slide transitions...');

// Read the zip and modify
const JSZip = (await import('jszip')).default;
const zipData = fs.readFileSync(tempPath);
const zip = await JSZip.loadAsync(zipData);

// Transition types to cycle through
const TRANSITIONS = ['fade', 'push', 'wipe', 'dissolve', 'uncover'];
const TRANS_DIRS = ['l', 'r', 'u', 'd']; // left, right, up, down

// Process each slide XML
const slideFiles = Object.keys(zip.files).filter(f => f.match(/^ppt\/slides\/slide\d+\.xml$/));
for (let i = 0; i < slideFiles.length; i++) {
  const fileName = slideFiles[i];
  const content = await zip.files[fileName].async('string');

  // Choose transition based on slide index (cover = push, rest cycle)
  const slideNum = i + 1;
  let transXml = '';
  if (slideNum === 1) {
    // Cover: fancy push up
    transXml = '<p:transition><p:push dir="u" /><p:spd val="slow" /></p:transition>';
  } else if (slideNum === TOTAL) {
    // Q&A: dissolve
    transXml = '<p:transition><p:dissolve /><p:spd val="slow" /></p:transition>';
  } else if (slideNum % 5 === 0) {
    // Every 5th slide: dissolve
    transXml = '<p:transition><p:dissolve /><p:spd val="medium" /></p:transition>';
  } else {
    const t = TRANSITIONS[(slideNum - 2) % TRANSITIONS.length];
    if (t === 'push' || t === 'wipe' || t === 'uncover') {
      const dir = TRANS_DIRS[(slideNum - 2) % TRANS_DIRS.length];
      transXml = `<p:transition><p:${t} dir="${dir}" /><p:spd val="medium" /></p:transition>`;
    } else {
      transXml = `<p:transition><p:${t} /><p:spd val="medium" /></p:transition>`;
    }
  }

  // Add transition after <p:cSld> ... </p:cSld> block
  const modified = content.replace('</p:cSld>', `</p:cSld>${transXml}`);
  zip.file(fileName, modified);
}

// Update [Content_Types].xml if needed - the transitions use standard types
// that are already included in default PPTX

const outputPath = '/mnt/d/工作区/Java核心技术精讲.pptx';
const outBuffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
fs.writeFileSync(outputPath, outBuffer);
console.log(`✅ Final PPT with transitions: ${outputPath}`);
console.log(`   File size: ${(outBuffer.length / 1024).toFixed(1)} KB`);
console.log(`   Slides: ${TOTAL}`);

// Clean up temp
fs.unlinkSync(tempPath);
console.log('🧹 Temp cleaned up');
