# MindCurrent

基于本地 Markdown 文件的精美笔记应用，数据完全由你掌控。

![Tech Stack](https://img.shields.io/badge/Electron-31-47848f?logo=electron) ![React](https://img.shields.io/badge/React-18-61dafb?logo=react) ![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178c6?logo=typescript) ![CodeMirror](https://img.shields.io/badge/CodeMirror-6-4c6ef5)

## 特性

- **纯本地存储** — 笔记以 `.md` 文件存储在本地文件夹，无需网络，数据完全由你掌控
- **多标签页** — 同时打开多篇笔记，标签页式切换
- **Markdown 编辑** — 基于 CodeMirror 6 的专业编辑器，支持语法高亮、自动补全、括号匹配
- **实时预览** — 支持分栏模式（编辑 + 预览）、纯编辑、纯预览三种视图
- **文件树浏览** — 侧边栏文件浏览器，支持新建/重命名/删除/拖拽移动
- **标签系统** — Frontmatter 标签，侧边栏标签筛选
- **全局搜索** — 按文件名和内容搜索整个笔记库
- **笔记内查找** — Ctrl+F 查找并跳转到当前笔记中的匹配位置
- **图片粘贴** — 直接粘贴剪贴板图片，自动保存到 assets 目录
- **文件监听** — 外部修改自动同步，无需手动刷新
- **自动保存** — 可按需配置延迟时间，Ctrl+S 手动保存
- **5 套色彩方案** — 默认蓝 / 暖琥珀 / 青翠绿 / 薰衣紫 / 海洋青，深浅模式自由切换
- **未保存保护** — 关闭有未保存更改的笔记或退出应用时弹出确认

## 安装

### 安装包（推荐）

下载 `MindCurrent Setup 0.1.0.exe`，双击安装即可。安装后从开始菜单或桌面快捷方式启动。

> Windows 可能弹出 "Windows 已保护你的电脑"，点击「更多信息 → 仍要运行」即可。

### 开发环境

```bash
git clone git@github.com:wuli-wa/Note-taking-tool.git
cd Note-taking-tool
npm install
npm run dev
```

## 使用

1. 首次启动显示欢迎页，点击「打开笔记库文件夹」选择一个已有笔记文件夹或新建空文件夹
2. 创建笔记：点击侧边栏 `+` 按钮，或右键文件夹选择「新建笔记」
3. 编写 Markdown 内容，右侧实时预览
4. 使用 Frontmatter 管理元数据：

```yaml
---
title: 笔记标题
tags: [标签1, 标签2]
created: 2026-05-08
---
正文内容...
```

## 快捷键

| 快捷键 | 功能 |
|--------|------|
| Ctrl+S | 保存当前笔记 |
| Ctrl+P | 全局搜索笔记 |
| Ctrl+F | 当前笔记内查找 |
| Enter | 查找下一个匹配 |
| Shift+Enter | 查找上一个匹配 |

## 技术栈

- **框架**: Electron 31
- **前端**: React 18 + TypeScript 5.5 + Zustand
- **编辑器**: CodeMirror 6 + @uiw/react-codemirror
- **Markdown**: react-markdown + remark-gfm + rehype-highlight
- **样式**: TailwindCSS 3.4
- **构建**: Vite 5 + electron-builder
- **图标**: lucide-react

## 项目结构

```
Note-taking-tool/
├── electron/           # Electron 主进程
│   ├── main.ts         # 主进程入口、IPC 处理
│   └── preload.ts      # 预加载脚本
├── src/
│   ├── App.tsx         # 应用根组件
│   ├── main.tsx        # React 入口
│   ├── index.css       # 全局样式 + 色彩方案
│   ├── store/          # Zustand 状态管理
│   ├── components/     # React 组件
│   │   ├── Editor.tsx      # CodeMirror 编辑器
│   │   ├── Preview.tsx     # Markdown 预览
│   │   ├── Sidebar.tsx     # 侧边栏文件树 + 标签
│   │   ├── Toolbar.tsx     # 顶栏
│   │   ├── Search.tsx      # 全局搜索
│   │   ├── Settings.tsx    # 设置面板
│   │   ├── StatusBar.tsx   # 底部状态栏
│   │   └── Welcome.tsx     # 欢迎页
│   ├── lib/            # 工具库
│   │   ├── fileManager.ts  # 文件操作
│   │   └── markdown.ts     # Markdown 解析
│   └── types/          # TypeScript 类型定义
├── package.json
└── vite.config.ts
```
