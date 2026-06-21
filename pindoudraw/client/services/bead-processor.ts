/**
 * 拼豆图纸 - 本地处理器（完全离线，不需要后端服务器）
 * 
 * 整个处理流程在 JavaScript 内完成：
 * 1. 加载图片 → 缩放到目标尺寸（使用 canvas）
 * 2. CIE Lab 色差匹配 → 找到最接近的 Mard 色号
 * 3. Floyd-Steinberg 误差扩散抖动
 * 4. 生成图例和像素数据
 */

// ====== Mard 221 色官方色号 ======
const MARD_COLORS: { hex: string; id: string; r: number; g: number; b: number; L: number; a: number; bVal: number }[] = [
  // A系 — 黄橙系
  { hex:'#FAF4C8',id:'Mard_A1',r:250,g:244,b:200,L:96,a:-2,bVal:18 },
  { hex:'#FFFFD5',id:'Mard_A2',r:255,g:255,b:213,L:99,a:-3,bVal:13 },
  { hex:'#FEFF8B',id:'Mard_A3',r:254,g:255,b:139,L:97,a:-10,bVal:56 },
  { hex:'#FBED56',id:'Mard_A4',r:251,g:237,b:86,L:91,a:-6,bVal:61 },
  { hex:'#F4D738',id:'Mard_A5',r:244,g:215,b:56,L:84,a:-1,bVal:61 },
  { hex:'#FEAC4C',id:'Mard_A6',r:254,g:172,b:76,L:73,a:38,bVal:54 },
  { hex:'#FE8B4C',id:'Mard_A7',r:254,g:139,b:76,L:64,a:46,bVal:46 },
  { hex:'#FFDA45',id:'Mard_A8',r:255,g:218,b:69,L:86,a:6,bVal:60 },
  { hex:'#FF995B',id:'Mard_A9',r:255,g:153,b:91,L:67,a:46,bVal:44 },
  { hex:'#F77C31',id:'Mard_A10',r:247,g:124,b:49,L:61,a:50,bVal:47 },
  { hex:'#FFDD99',id:'Mard_A11',r:255,g:221,b:153,L:89,a:8,bVal:24 },
  { hex:'#FE9F72',id:'Mard_A12',r:254,g:159,b:114,L:70,a:40,bVal:29 },
  { hex:'#FFC365',id:'Mard_A13',r:255,g:195,b:101,L:80,a:24,bVal:44 },
  { hex:'#FD543D',id:'Mard_A14',r:253,g:84,b:61,L:55,a:66,bVal:43 },
  { hex:'#FFF365',id:'Mard_A15',r:255,g:243,b:101,L:94,a:-7,bVal:53 },
  { hex:'#FFFF9F',id:'Mard_A16',r:255,g:255,b:159,L:98,a:-7,bVal:30 },
  { hex:'#FFE36E',id:'Mard_A17',r:255,g:227,b:110,L:90,a:1,bVal:48 },
  { hex:'#FEBE7D',id:'Mard_A18',r:254,g:190,b:125,L:79,a:23,bVal:33 },
  { hex:'#FD7C72',id:'Mard_A19',r:253,g:124,b:114,L:63,a:52,bVal:20 },
  { hex:'#FFD568',id:'Mard_A20',r:255,g:213,b:104,L:85,a:9,bVal:46 },
  { hex:'#FFE395',id:'Mard_A21',r:255,g:227,b:149,L:90,a:4,bVal:30 },
  { hex:'#F4F57D',id:'Mard_A22',r:244,g:245,b:125,L:94,a:-11,bVal:44 },
  { hex:'#E6C9B7',id:'Mard_A23',r:230,g:201,b:183,L:83,a:11,bVal:12 },
  { hex:'#F7F8A2',id:'Mard_A24',r:247,g:248,b:162,L:96,a:-9,bVal:34 },
  { hex:'#FFD67D',id:'Mard_A25',r:255,g:214,b:125,L:86,a:11,bVal:38 },
  { hex:'#FFC830',id:'Mard_A26',r:255,g:200,b:48,L:80,a:17,bVal:62 },
  // B系 — 绿色系
  { hex:'#E6EE31',id:'Mard_B1',r:230,g:238,b:49,L:89,a:-20,bVal:66 },
  { hex:'#63F347',id:'Mard_B2',r:99,g:243,b:71,L:86,a:-57,bVal:51 },
  { hex:'#9EF780',id:'Mard_B3',r:158,g:247,b:128,L:90,a:-46,bVal:38 },
  { hex:'#5DE035',id:'Mard_B4',r:93,g:224,b:53,L:80,a:-48,bVal:49 },
  { hex:'#35E352',id:'Mard_B5',r:53,g:227,b:82,L:81,a:-54,bVal:38 },
  { hex:'#65E2A6',id:'Mard_B6',r:101,g:226,b:166,L:82,a:-43,bVal:17 },
  { hex:'#3DAF80',id:'Mard_B7',r:61,g:175,b:128,L:64,a:-39,bVal:9 },
  { hex:'#1C9C4F',id:'Mard_B8',r:28,g:156,b:79,L:57,a:-42,bVal:23 },
  { hex:'#27523A',id:'Mard_B9',r:39,g:82,b:58,L:32,a:-20,bVal:8 },
  { hex:'#95D3C2',id:'Mard_B10',r:149,g:211,b:194,L:80,a:-22,bVal:5 },
  { hex:'#5D722A',id:'Mard_B11',r:93,g:114,b:42,L:45,a:-15,bVal:27 },
  { hex:'#166F41',id:'Mard_B12',r:22,g:111,b:65,L:41,a:-33,bVal:13 },
  { hex:'#CAEB7B',id:'Mard_B13',r:202,g:235,b:123,L:90,a:-25,bVal:43 },
  { hex:'#ADE946',id:'Mard_B14',r:173,g:233,b:70,L:88,a:-34,bVal:57 },
  { hex:'#2E5132',id:'Mard_B15',r:46,g:81,b:50,L:32,a:-17,bVal:8 },
  { hex:'#C5ED9C',id:'Mard_B16',r:197,g:237,b:156,L:91,a:-28,bVal:28 },
  { hex:'#9BB13A',id:'Mard_B17',r:155,g:177,b:58,L:69,a:-23,bVal:39 },
  { hex:'#E6EE49',id:'Mard_B18',r:230,g:238,b:73,L:91,a:-20,bVal:60 },
  { hex:'#24B88C',id:'Mard_B19',r:36,g:184,b:140,L:67,a:-39,bVal:9 },
  { hex:'#C2F0CC',id:'Mard_B20',r:194,g:240,b:204,L:92,a:-25,bVal:10 },
  { hex:'#156A6B',id:'Mard_B21',r:21,g:106,b:107,L:40,a:-22,bVal:-4 },
  { hex:'#0B3C43',id:'Mard_B22',r:11,g:60,b:67,L:22,a:-12,bVal:-6 },
  { hex:'#303A21',id:'Mard_B23',r:48,g:58,b:33,L:23,a:-8,bVal:10 },
  { hex:'#EEFCA5',id:'Mard_B24',r:238,g:252,b:165,L:96,a:-15,bVal:32 },
  { hex:'#4E846D',id:'Mard_B25',r:78,g:132,b:109,L:52,a:-22,bVal:5 },
  { hex:'#8D7A35',id:'Mard_B26',r:141,g:122,b:53,L:51,a:2,bVal:30 },
  { hex:'#CCE1AF',id:'Mard_B27',r:204,g:225,b:175,L:87,a:-14,bVal:18 },
  { hex:'#9EE5B9',id:'Mard_B28',r:158,g:229,b:185,L:87,a:-31,bVal:13 },
  { hex:'#C5E254',id:'Mard_B29',r:197,g:226,b:84,L:88,a:-24,bVal:51 },
  { hex:'#E2FCB1',id:'Mard_B30',r:226,g:252,b:177,L:96,a:-18,bVal:27 },
  { hex:'#B0E792',id:'Mard_B31',r:176,g:231,b:146,L:88,a:-31,bVal:26 },
  { hex:'#9CAB5A',id:'Mard_B32',r:156,g:171,b:90,L:68,a:-14,bVal:28 },
  // C系 — 蓝青系  
  { hex:'#E8FFE7',id:'Mard_C1',r:232,g:255,b:231,L:98,a:-10,bVal:8 },
  { hex:'#A9F9FC',id:'Mard_C2',r:169,g:249,b:252,L:94,a:-26,bVal:-14 },
  { hex:'#A0E2FB',id:'Mard_C3',r:160,g:226,b:251,L:87,a:-21,bVal:-17 },
  { hex:'#41CCFF',id:'Mard_C4',r:65,g:204,b:255,L:76,a:-24,bVal:-37 },
  { hex:'#01ACEB',id:'Mard_C5',r:1,g:172,b:235,L:64,a:-18,bVal:-40 },
  { hex:'#50AAF0',id:'Mard_C6',r:80,g:170,b:240,L:67,a:-3,bVal:-41 },
  { hex:'#3677D2',id:'Mard_C7',r:54,g:119,b:210,L:50,a:15,bVal:-52 },
  { hex:'#0F54C0',id:'Mard_C8',r:15,g:84,b:192,L:36,a:17,bVal:-55 },
  { hex:'#324BCA',id:'Mard_C9',r:50,g:75,b:202,L:33,a:35,bVal:-63 },
  { hex:'#3EBCE2',id:'Mard_C10',r:62,g:188,b:226,L:71,a:-19,bVal:-29 },
  { hex:'#28DDDE',id:'Mard_C11',r:40,g:221,b:222,L:80,a:-40,bVal:-14 },
  { hex:'#1C334D',id:'Mard_C12',r:28,g:51,b:77,L:20,a:5,bVal:-18 },
  { hex:'#CDE8FF',id:'Mard_C13',r:205,g:232,b:255,L:90,a:-8,bVal:-15 },
  { hex:'#D5FDFF',id:'Mard_C14',r:213,g:253,b:255,L:97,a:-15,bVal:-7 },
  { hex:'#22C4C6',id:'Mard_C15',r:34,g:196,b:198,L:72,a:-34,bVal:-10 },
  { hex:'#1557A8',id:'Mard_C16',r:21,g:87,b:168,L:37,a:16,bVal:-49 },
  { hex:'#04D1F6',id:'Mard_C17',r:4,g:209,b:246,L:77,a:-33,bVal:-38 },
  { hex:'#1D3344',id:'Mard_C18',r:29,g:51,b:68,L:20,a:1,bVal:-13 },
  { hex:'#1887A2',id:'Mard_C19',r:24,g:135,b:162,L:51,a:-17,bVal:-21 },
  { hex:'#176DAF',id:'Mard_C20',r:23,g:109,b:175,L:44,a:5,bVal:-41 },
  { hex:'#BEDDFF',id:'Mard_C21',r:190,g:221,b:255,L:87,a:-5,bVal:-16 },
  { hex:'#67B4BE',id:'Mard_C22',r:103,g:180,b:190,L:69,a:-21,bVal:-12 },
  { hex:'#C8E2FF',id:'Mard_C23',r:200,g:226,b:255,L:89,a:-6,bVal:-15 },
  { hex:'#7CC4FF',id:'Mard_C24',r:124,g:196,b:255,L:76,a:-7,bVal:-39 },
  { hex:'#A9E5E5',id:'Mard_C25',r:169,g:229,b:229,L:88,a:-24,bVal:-7 },
  { hex:'#3CAED8',id:'Mard_C26',r:60,g:174,b:216,L:66,a:-14,bVal:-33 },
  { hex:'#D3DFFA',id:'Mard_C27',r:211,g:223,b:250,L:88,a:0,bVal:-15 },
  { hex:'#BBCFED',id:'Mard_C28',r:187,g:207,b:237,L:82,a:0,bVal:-17 },
  { hex:'#34488E',id:'Mard_C29',r:52,g:72,b:142,L:31,a:17,bVal:-38 },
  // D系 — 蓝紫系
  { hex:'#AEB4F2',id:'Mard_D1',r:174,g:180,b:242,L:73,a:12,bVal:-31 },
  { hex:'#858EDD',id:'Mard_D2',r:133,g:142,b:221,L:59,a:14,bVal:-35 },
  { hex:'#2F54AF',id:'Mard_D3',r:47,g:84,b:175,L:37,a:24,bVal:-49 },
  { hex:'#182A84',id:'Mard_D4',r:24,g:42,b:132,L:19,a:24,bVal:-50 },
  { hex:'#B843C5',id:'Mard_D5',r:184,g:67,b:197,L:46,a:55,bVal:-32 },
  { hex:'#AC7BDE',id:'Mard_D6',r:172,g:123,b:222,L:57,a:35,bVal:-37 },
  { hex:'#8854B3',id:'Mard_D7',r:136,g:84,b:179,L:43,a:35,bVal:-31 },
  { hex:'#E2D3FF',id:'Mard_D8',r:226,g:211,b:255,L:86,a:10,bVal:-19 },
  { hex:'#D5B9F8',id:'Mard_D9',r:213,g:185,b:248,L:78,a:19,bVal:-26 },
  { hex:'#361851',id:'Mard_D10',r:54,g:24,b:81,L:14,a:24,bVal:-21 },
  { hex:'#B9BAE1',id:'Mard_D11',r:185,g:186,b:225,L:75,a:7,bVal:-17 },
  { hex:'#DE9AD4',id:'Mard_D12',r:222,g:154,b:212,L:69,a:32,bVal:-18 },
  { hex:'#B90095',id:'Mard_D13',r:185,g:0,b:149,L:37,a:62,bVal:-18 },
  { hex:'#8B279B',id:'Mard_D14',r:139,g:39,b:155,L:33,a:51,bVal:-26 },
  { hex:'#2F1F90',id:'Mard_D15',r:47,g:31,b:144,L:17,a:33,bVal:-50 },
  { hex:'#E3E1EE',id:'Mard_D16',r:227,g:225,b:238,L:89,a:3,bVal:-6 },
  { hex:'#C4D4F6',id:'Mard_D17',r:196,g:212,b:246,L:84,a:4,bVal:-18 },
  { hex:'#A45EC7',id:'Mard_D18',r:164,g:94,b:199,L:48,a:40,bVal:-34 },
  { hex:'#D8C3D7',id:'Mard_D19',r:216,g:195,b:215,L:80,a:13,bVal:-7 },
  { hex:'#9C32B2',id:'Mard_D20',r:156,g:50,b:178,L:39,a:51,bVal:-30 },
  { hex:'#9A009B',id:'Mard_D21',r:154,g:0,b:155,L:32,a:60,bVal:-26 },
  { hex:'#333A95',id:'Mard_D22',r:51,g:58,b:149,L:27,a:21,bVal:-46 },
  { hex:'#EBDAFC',id:'Mard_D23',r:235,g:218,b:252,L:88,a:12,bVal:-16 },
  { hex:'#7786E5',id:'Mard_D24',r:119,g:134,b:229,L:56,a:15,bVal:-41 },
  { hex:'#494FC7',id:'Mard_D25',r:73,g:79,b:199,L:35,a:25,bVal:-52 },
  { hex:'#DFC2F8',id:'Mard_D26',r:223,g:194,b:248,L:81,a:19,bVal:-22 },
  // E系 — 粉玫系
  { hex:'#FDD3CC',id:'Mard_E1',r:253,g:211,b:204,L:86,a:16,bVal:8 },
  { hex:'#FEC0DF',id:'Mard_E2',r:254,g:192,b:223,L:81,a:26,bVal:-8 },
  { hex:'#FFB7E7',id:'Mard_E3',r:255,g:183,b:231,L:79,a:36,bVal:-10 },
  { hex:'#E8649E',id:'Mard_E4',r:232,g:100,b:158,L:56,a:47,bVal:-8 },
  { hex:'#F551A2',id:'Mard_E5',r:245,g:81,b:162,L:54,a:59,bVal:-9 },
  { hex:'#F13D74',id:'Mard_E6',r:241,g:61,b:116,L:50,a:63,bVal:8 },
  { hex:'#C63478',id:'Mard_E7',r:198,g:52,b:120,L:44,a:50,bVal:-2 },
  { hex:'#FFDBE9',id:'Mard_E8',r:255,g:219,b:233,L:89,a:16,bVal:-2 },
  { hex:'#E970CC',id:'Mard_E9',r:233,g:112,b:204,L:61,a:48,bVal:-22 },
  { hex:'#D33793',id:'Mard_E10',r:211,g:55,b:147,L:48,a:57,bVal:-10 },
  { hex:'#FCDDD2',id:'Mard_E11',r:252,g:221,b:210,L:89,a:12,bVal:10 },
  { hex:'#F78FC3',id:'Mard_E12',r:247,g:143,b:195,L:69,a:40,bVal:-12 },
  { hex:'#B5006D',id:'Mard_E13',r:181,g:0,b:109,L:35,a:57,bVal:-4 },
  { hex:'#FFD1BA',id:'Mard_E14',r:255,g:209,b:186,L:85,a:17,bVal:16 },
  { hex:'#F8C7C9',id:'Mard_E15',r:248,g:199,b:201,L:83,a:21,bVal:5 },
  { hex:'#FFF3EB',id:'Mard_E16',r:255,g:243,b:235,L:95,a:5,bVal:7 },
  { hex:'#FFE2EA',id:'Mard_E17',r:255,g:226,b:234,L:91,a:13,bVal:0 },
  { hex:'#FFC7DB',id:'Mard_E18',r:255,g:199,b:219,L:83,a:24,bVal:-2 },
  { hex:'#FEBAD5',id:'Mard_E19',r:254,g:186,b:213,L:79,a:29,bVal:-4 },
  { hex:'#D8C7D1',id:'Mard_E20',r:216,g:199,b:209,L:81,a:12,bVal:-3 },
  { hex:'#BD9DA1',id:'Mard_E21',r:189,g:157,b:161,L:67,a:16,bVal:1 },
  { hex:'#B785A1',id:'Mard_E22',r:183,g:133,b:161,L:59,a:23,bVal:-3 },
  { hex:'#937A8D',id:'Mard_E23',r:147,g:122,b:141,L:54,a:16,bVal:-3 },
  { hex:'#E1BCE8',id:'Mard_E24',r:225,g:188,b:232,L:79,a:22,bVal:-16 },
  // F系 — 红色系
  { hex:'#FD957B',id:'Mard_F1',r:253,g:149,b:123,L:69,a:46,bVal:25 },
  { hex:'#FC3D46',id:'Mard_F2',r:252,g:61,b:70,L:52,a:71,bVal:30 },
  { hex:'#F74941',id:'Mard_F3',r:247,g:73,b:65,L:52,a:68,bVal:34 },
  { hex:'#FC283C',id:'Mard_F4',r:252,g:40,b:60,L:50,a:77,bVal:34 },
  { hex:'#E7002F',id:'Mard_F5',r:231,g:0,b:47,L:45,a:77,bVal:42 },
  { hex:'#943630',id:'Mard_F6',r:148,g:54,b:48,L:36,a:38,bVal:19 },
  { hex:'#971937',id:'Mard_F7',r:151,g:25,b:55,L:30,a:48,bVal:16 },
  { hex:'#BC0028',id:'Mard_F8',r:188,g:0,b:40,L:37,a:65,bVal:31 },
  { hex:'#E2677A',id:'Mard_F9',r:226,g:103,b:122,L:56,a:46,bVal:8 },
  { hex:'#8A4526',id:'Mard_F10',r:138,g:69,b:38,L:36,a:30,bVal:26 },
  { hex:'#5A2121',id:'Mard_F11',r:90,g:33,b:33,L:21,a:27,bVal:11 },
  { hex:'#FD4E6A',id:'Mard_F12',r:253,g:78,b:106,L:55,a:63,bVal:17 },
  { hex:'#F35744',id:'Mard_F13',r:243,g:87,b:68,L:55,a:61,bVal:33 },
  { hex:'#FFA9AD',id:'Mard_F14',r:255,g:169,b:173,L:75,a:35,bVal:8 },
  { hex:'#D30022',id:'Mard_F15',r:211,g:0,b:34,L:40,a:69,bVal:36 },
  { hex:'#FEC2A6',id:'Mard_F16',r:254,g:194,b:166,L:82,a:24,bVal:22 },
  { hex:'#E69C79',id:'Mard_F17',r:230,g:156,b:121,L:71,a:32,bVal:24 },
  { hex:'#D37C46',id:'Mard_F18',r:211,g:124,b:70,L:61,a:34,bVal:33 },
  { hex:'#C1444A',id:'Mard_F19',r:193,g:68,b:74,L:46,a:48,bVal:18 },
  { hex:'#CD9391',id:'Mard_F20',r:205,g:147,b:145,L:65,a:27,bVal:9 },
  { hex:'#F7B4C6',id:'Mard_F21',r:247,g:180,b:198,L:78,a:29,bVal:0 },
  { hex:'#FDC0D0',id:'Mard_F22',r:253,g:192,b:208,L:82,a:26,bVal:2 },
  { hex:'#F67E66',id:'Mard_F23',r:246,g:126,b:102,L:65,a:49,bVal:27 },
  { hex:'#E698AA',id:'Mard_F24',r:230,g:152,b:170,L:69,a:32,bVal:0 },
  { hex:'#E54B4F',id:'Mard_F25',r:229,g:75,b:79,L:52,a:58,bVal:22 },
  // G系 — 棕肤系
  { hex:'#FFE2CE',id:'Mard_G1',r:255,g:226,b:206,L:90,a:10,bVal:14 },
  { hex:'#FFC4AA',id:'Mard_G2',r:255,g:196,b:170,L:82,a:24,bVal:21 },
  { hex:'#F4C3A5',id:'Mard_G3',r:244,g:195,b:165,L:81,a:20,bVal:19 },
  { hex:'#E1B383',id:'Mard_G4',r:225,g:179,b:131,L:75,a:17,bVal:26 },
  { hex:'#EDB045',id:'Mard_G5',r:237,g:176,b:69,L:73,a:15,bVal:50 },
  { hex:'#E99C17',id:'Mard_G6',r:233,g:156,b:23,L:66,a:19,bVal:57 },
  { hex:'#9D5B3E',id:'Mard_G7',r:157,g:91,b:62,L:44,a:27,bVal:25 },
  { hex:'#753832',id:'Mard_G8',r:117,g:56,b:50,L:31,a:26,bVal:13 },
  { hex:'#E6B483',id:'Mard_G9',r:230,g:180,b:131,L:75,a:16,bVal:25 },
  { hex:'#D98C39',id:'Mard_G10',r:217,g:140,b:57,L:63,a:26,bVal:47 },
  { hex:'#E0C593',id:'Mard_G11',r:224,g:197,b:147,L:80,a:6,bVal:22 },
  { hex:'#FFC890',id:'Mard_G12',r:255,g:200,b:144,L:82,a:20,bVal:30 },
  { hex:'#B7714A',id:'Mard_G13',r:183,g:113,b:74,L:55,a:29,bVal:28 },
  { hex:'#8D614C',id:'Mard_G14',r:141,g:97,b:76,L:44,a:20,bVal:18 },
  { hex:'#FCF9E0',id:'Mard_G15',r:252,g:249,b:224,L:97,a:-3,bVal:12 },
  { hex:'#F2D9BA',id:'Mard_G16',r:242,g:217,b:186,L:87,a:5,bVal:17 },
  { hex:'#78524B',id:'Mard_G17',r:120,g:82,b:75,L:38,a:19,bVal:10 },
  { hex:'#FFE4CC',id:'Mard_G18',r:255,g:228,b:204,L:91,a:9,bVal:15 },
  { hex:'#E07935',id:'Mard_G19',r:224,g:121,b:53,L:62,a:41,bVal:45 },
  { hex:'#A94023',id:'Mard_G20',r:169,g:64,b:35,L:39,a:40,bVal:31 },
  { hex:'#B88558',id:'Mard_G21',r:184,g:133,b:88,L:58,a:18,bVal:27 },
  // H系 — 黑白系
  { hex:'#FDFBFF',id:'Mard_H1',r:253,g:251,b:255,L:99,a:2,bVal:-2 },
  { hex:'#FEFFFF',id:'Mard_H2',r:254,g:255,b:255,L:100,a:0,bVal:0 },
  { hex:'#B6B1BA',id:'Mard_H3',r:182,g:177,b:186,L:72,a:4,bVal:-5 },
  { hex:'#89858C',id:'Mard_H4',r:137,g:133,b:140,L:55,a:3,bVal:-4 },
  { hex:'#48464E',id:'Mard_H5',r:72,g:70,b:78,L:30,a:3,bVal:-4 },
  { hex:'#2F2B2F',id:'Mard_H6',r:47,g:43,b:47,L:18,a:2,bVal:-2 },
  { hex:'#000000',id:'Mard_H7',r:0,g:0,b:0,L:0,a:0,bVal:0 },
  { hex:'#E7D6DB',id:'Mard_H8',r:231,g:214,b:219,L:87,a:9,bVal:-1 },
  { hex:'#EDEDED',id:'Mard_H9',r:237,g:237,b:237,L:94,a:0,bVal:0 },
  { hex:'#EEE9EA',id:'Mard_H10',r:238,g:233,b:234,L:93,a:3,bVal:0 },
  { hex:'#CECDD5',id:'Mard_H11',r:206,g:205,b:213,L:82,a:2,bVal:-4 },
  { hex:'#FFF5ED',id:'Mard_H12',r:255,g:245,b:237,L:96,a:4,bVal:6 },
  { hex:'#F5ECD2',id:'Mard_H13',r:245,g:236,b:210,L:93,a:-1,bVal:12 },
  { hex:'#CFD7D3',id:'Mard_H14',r:207,g:215,b:211,L:85,a:-4,bVal:1 },
  { hex:'#98A6A8',id:'Mard_H15',r:152,g:166,b:168,L:67,a:-6,bVal:-2 },
  { hex:'#1D1414',id:'Mard_H16',r:29,g:20,b:20,L:8,a:5,bVal:3 },
  { hex:'#F1EDED',id:'Mard_H17',r:241,g:237,b:237,L:94,a:3,bVal:1 },
  { hex:'#FFFDF0',id:'Mard_H18',r:255,g:253,b:240,L:99,a:-1,bVal:6 },
  { hex:'#F6EFE2',id:'Mard_H19',r:246,g:239,b:226,L:94,a:1,bVal:9 },
  { hex:'#949FA3',id:'Mard_H20',r:148,g:159,b:163,L:65,a:-4,bVal:-3 },
  { hex:'#FFFBE1',id:'Mard_H21',r:255,g:251,b:225,L:98,a:-3,bVal:12 },
  { hex:'#CACAD4',id:'Mard_H22',r:202,g:202,b:212,L:81,a:2,bVal:-5 },
  { hex:'#9A9D94',id:'Mard_H23',r:154,g:157,b:148,L:64,a:-2,bVal:5 },
  // M系 — 大地系
  { hex:'#BCC6B8',id:'Mard_M1',r:188,g:198,b:184,L:79,a:-5,bVal:5 },
  { hex:'#8AA386',id:'Mard_M2',r:138,g:163,b:134,L:64,a:-12,bVal:10 },
  { hex:'#697D80',id:'Mard_M3',r:105,g:125,b:128,L:50,a:-8,bVal:-2 },
  { hex:'#E3D2BC',id:'Mard_M4',r:227,g:210,b:188,L:84,a:5,bVal:13 },
  { hex:'#D0CCAA',id:'Mard_M5',r:208,g:204,b:170,L:81,a:-2,bVal:14 },
  { hex:'#B0A782',id:'Mard_M6',r:176,g:167,b:130,L:68,a:1,bVal:16 },
  { hex:'#B4A497',id:'Mard_M7',r:180,g:164,b:151,L:67,a:7,bVal:11 },
  { hex:'#B38281',id:'Mard_M8',r:179,g:130,b:129,L:58,a:20,bVal:8 },
  { hex:'#A58767',id:'Mard_M9',r:165,g:135,b:103,L:57,a:9,bVal:20 },
  { hex:'#C5B2BC',id:'Mard_M10',r:197,g:178,b:188,L:73,a:11,bVal:-3 },
  { hex:'#9F7594',id:'Mard_M11',r:159,g:117,b:148,L:53,a:22,bVal:-7 },
  { hex:'#644749',id:'Mard_M12',r:100,g:71,b:73,L:33,a:15,bVal:4 },
  { hex:'#D19066',id:'Mard_M13',r:209,g:144,b:102,L:65,a:29,bVal:28 },
  { hex:'#C77362',id:'Mard_M14',r:199,g:115,b:98,L:56,a:32,bVal:19 },
  { hex:'#757D78',id:'Mard_M15',r:117,g:125,b:120,L:51,a:-5,bVal:3 },
];

// ====== 颜色匹配函数 ======

export interface BeadProcessResult {
  width: number;
  height: number;
  pixels: number[][];
  colorMap: { id: string; hex: string; count: number; percentage: number }[];
  totalBeads: number;
}

function srgbToLinear(v: number): number {
  const c = v / 255;
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function deltaE(lab: { L: number; a: number; b: number }, color: typeof MARD_COLORS[0]): number {
  const dL = lab.L - color.L;
  const da = lab.a - color.a;
  const db = lab.b - color.bVal;
  return Math.sqrt(dL * dL + da * da + db * db);
}

function rgbToLab(r: number, g: number, b: number): { L: number; a: number; b: number } {
  const rl = srgbToLinear(r), gl = srgbToLinear(g), bl = srgbToLinear(b);
  const x = 0.4124564 * rl + 0.3575761 * gl + 0.1804375 * bl;
  const y = 0.2126729 * rl + 0.7151522 * gl + 0.0721750 * bl;
  const z = 0.0193339 * rl + 0.1191920 * gl + 0.9503041 * bl;
  const xn = 0.95047, yn = 1.0, zn = 1.08883;
  const fx = x / xn > 0.008856 ? Math.cbrt(x / xn) : (7.787 * x / xn + 16 / 116);
  const fy = y / yn > 0.008856 ? Math.cbrt(y / yn) : (7.787 * y / yn + 16 / 116);
  const fz = z / zn > 0.008856 ? Math.cbrt(z / zn) : (7.787 * z / zn + 16 / 116);
  return { L: 116 * fy - 16, a: 500 * (fx - fy), b: 200 * (fy - fz) };
}

function findClosest(r: number, g: number, b: number): typeof MARD_COLORS[0] {
  const targetLab = rgbToLab(r, g, b);
  let best = MARD_COLORS[0];
  let bestDist = deltaE(targetLab, best);
  for (const c of MARD_COLORS) {
    const d = deltaE(targetLab, c);
    if (d < bestDist) { bestDist = d; best = c; }
  }
  return best;
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  let r=l,g=l,b=l;
  if(s!==0){
    const hue2rgb=(p:number,q:number,t:number)=>{
      if(t<0)t+=1;if(t>1)t-=1;
      if(t<1/6)return p+(q-p)*6*t;
      if(t<1/2)return q;
      if(t<2/3)return p+(q-p)*(2/3-t)*6;
      return p;
    };
    const q=l<0.5?l*(1+s):l+s-l*s;
    const p=2*l-q;
    r=hue2rgb(p,q,h+1/3);g=hue2rgb(p,q,h);b=hue2rgb(p,q,h-1/3);
  }
  return [Math.round(r*255),Math.round(g*255),Math.round(b*255)];
}

/** 在 Canvas 中处理图片，返回处理结果 */
export async function processImageOnDevice(
  imageData: ImageData,
  targetSize: number,
  saturation: number,
  paletteCompression: string
): Promise<BeadProcessResult> {
  const { width, height, data } = imageData;
  
  // 缩放图片到目标尺寸
  const scale = Math.min(targetSize / width, targetSize / height);
  const tW = Math.round(width * scale);
  const tH = Math.round(height * scale);
  
  // 简化：用 Canvas 缩放后读像素
  const canvas = document.createElement('canvas');
  canvas.width = tW;
  canvas.height = tH;
  const ctx = canvas.getContext('2d')!;
  
  // 先将原图画到 canvas 缩放到目标尺寸
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = width;
  tempCanvas.height = height;
  const tempCtx = tempCanvas.getContext('2d')!;
  const tempImageData = tempCtx.createImageData(width, height);
  tempImageData.data.set(data);
  tempCtx.putImageData(tempImageData, 0, 0);
  ctx.drawImage(tempCanvas, 0, 0, tW, tH);
  
  const scaledData = ctx.getImageData(0, 0, tW, tH).data;
  
  // Floyd-Steinberg 抖动
  const floatPixels: number[][] = [];
  for (let y = 0; y < tH; y++) {
    const row: number[] = [];
    for (let x = 0; x < tW; x++) {
      const i = (y * tW + x) * 4;
      // 饱和度增强
      const r = scaledData[i], g = scaledData[i+1], b = scaledData[i+2];
      const max = Math.max(r,g,b)/255, min = Math.min(r,g,b)/255;
      const l = (max+min)/2;
      let s = 0;
      if (max !== min) s = l > 0.5 ? (max-min)/(2-max-min) : (max-min)/(max+min);
      s = Math.min(s * saturation, 1);
      const [sr, sg, sb] = hslToRgb(0, s, l); // hue approximation
      row.push(sr, sg, sb);
    }
    floatPixels.push(row);
  }
  
  const pixels: number[][] = [];
  const colorMap = new Map<number, typeof MARD_COLORS[0]>();
  let colorIdx = 0;
  
  for (let y = 0; y < tH; y++) {
    const row: number[] = [];
    for (let x = 0; x < tW; x++) {
      const i = x * 3;
      let r = Math.round(Math.max(0, Math.min(255, floatPixels[y][i])));
      let g = Math.round(Math.max(0, Math.min(255, floatPixels[y][i+1])));
      let b = Math.round(Math.max(0, Math.min(255, floatPixels[y][i+2])));
      
      const matched = findClosest(r, g, b);
      
      const er = r - matched.r, eg = g - matched.g, eb = b - matched.b;
      
      // 误差扩散
      if (x+1 < tW) { floatPixels[y][(x+1)*3] += er*7/16; floatPixels[y][(x+1)*3+1] += eg*7/16; floatPixels[y][(x+1)*3+2] += eb*7/16; }
      if (y+1 < tH) {
        if (x > 0) { floatPixels[y+1][(x-1)*3] += er*3/16; floatPixels[y+1][(x-1)*3+1] += eg*3/16; floatPixels[y+1][(x-1)*3+2] += eb*3/16; }
        floatPixels[y+1][x*3] += er*5/16; floatPixels[y+1][x*3+1] += eg*5/16; floatPixels[y+1][x*3+2] += eb*5/16;
        if (x+1 < tW) { floatPixels[y+1][(x+1)*3] += er/16; floatPixels[y+1][(x+1)*3+1] += eg/16; floatPixels[y+1][(x+1)*3+2] += eb/16; }
      }
      
      // 查找或添加颜色
      let found = -1;
      for (const [idx, c] of colorMap) {
        if (c.hex === matched.hex) { found = idx; break; }
      }
      if (found >= 0) {
        row.push(found);
      } else {
        colorMap.set(colorIdx, matched);
        row.push(colorIdx);
        colorIdx++;
      }
    }
    pixels.push(row);
  }
  
  // 调色板压缩
  const config: Record<string, {thres:number;max:number}> = {
    off: {thres:0, max:999}, light: {thres:40, max:10},
    standard: {thres:55, max:7}, heavy: {thres:70, max:5}
  };
  const cfg = config[paletteCompression] || config.off;
  
  if (cfg.thres > 0) {
    const { newMap, newPixels } = compress(cfg.thres, cfg.max);
    colorMap.clear();
    for (const [k,v] of newMap) colorMap.set(k,v);
    pixels.length = 0;
    pixels.push(...newPixels);
  }
  
  function compress(threshold: number, maxColors: number) {
    let th = threshold;
    for (let attempt = 0; attempt < 15; attempt++) {
      const usage = new Map<number, number>();
      for (const row of pixels) for (const idx of row) usage.set(idx, (usage.get(idx)||0)+1);
      const sorted = [...usage.entries()].sort((a,b) => b[1]-a[1]);
      if (sorted.length <= maxColors) break;
      
      const kept: number[] = [];
      const mergeTarget = new Map<number, number>();
      
      for (const [idx] of sorted) {
        const color = colorMap.get(idx);
        if (!color) continue;
        let merged = false;
        for (const kIdx of kept) {
          const kc = colorMap.get(kIdx);
          if (!kc) continue;
          const d = Math.sqrt((color.r-kc.r)**2 + (color.g-kc.g)**2 + (color.b-kc.b)**2);
          if (d < th) { mergeTarget.set(idx, kIdx); merged = true; break; }
        }
        if (!merged) { kept.push(idx); mergeTarget.set(idx, idx); }
      }
      
      if (kept.length <= maxColors) {
        const newMap = new Map<number, typeof MARD_COLORS[0]>();
        const oldToNew = new Map<number, number>();
        kept.forEach((k,i) => { newMap.set(i, colorMap.get(k)!); oldToNew.set(k,i); });
        const newPixels = pixels.map(r => r.map(idx => oldToNew.get(mergeTarget.get(idx)!)!));
        return { newMap, newPixels };
      }
      th += Math.max(5, th * 0.15);
    }
    return { newMap: colorMap, newPixels: pixels };
  }
  
  // 统计
  const usage = new Map<number, number>();
  for (const row of pixels) for (const idx of row) usage.set(idx, (usage.get(idx)||0)+1);
  const total = tW * tH;
  const legend = [...usage.entries()]
    .map(([idx, count]) => ({ id: colorMap.get(idx)!.id, hex: colorMap.get(idx)!.hex, count, percentage: Math.round(count/total*100) }))
    .sort((a,b) => b.count - a.count);
  
  return { width: tW, height: tH, pixels, colorMap: legend, totalBeads: total };
}

export { MARD_COLORS, findClosest };
