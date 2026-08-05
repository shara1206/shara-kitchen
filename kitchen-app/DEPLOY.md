# 用 GitHub Desktop 发布 Shara's Kitchen —— 详细步骤
### （中文说明，括号里是软件上的英文按钮名。全程约 20 分钟。）

**要点**：直接对着你的原文件夹 **`D:\Claude Projects\Food`** 操作，不需要那个 zip。
`.backups`（158MB 的备份）已被自动排除，只会上传约 12MB 的真正文件。

---

## 第 1 步 — 安装并登录 GitHub Desktop

1. 打开 **https://desktop.github.com** → 点 **Download** 下载 → 安装 → 打开。
2. 首次打开会让你登录：点 **Sign in to GitHub.com**。
   - 没有账号：点 **Create your free account**，用邮箱注册（设用户名、密码，去邮箱填验证码），
     然后回到 GitHub Desktop 登录。
3. 它会问你的名字/邮箱（用于提交记录），一路 **Continue / Finish** 即可。

---

## 第 2 步 — 把你的项目文件夹加进来

1. 顶部菜单 **File → Add local repository**（添加本地仓库）。
2. 点 **Choose…**，选择文件夹 **`D:\Claude Projects\Food`** → **Add repository**。
3. 它会提示：*"This directory does not appear to be a Git repository"*
   （这个目录还不是 Git 仓库）→ 点蓝字 **create a repository**（创建一个仓库）。
4. 弹出 **Create a repository** 窗口：
   - **Name**：自动填成 `Food`，你可以改成 `shara-kitchen`（可选，随意）。
   - **Git ignore** 选 **None**（你已经有 `.gitignore` 了，不用再加）。
   - **License** 选 **None**。
   - 点 **Create repository**。

---

## 第 3 步 — 第一次提交（Commit）

1. 左侧 **Changes** 会列出要提交的文件（**不会**包含 `.backups`，放心）。
2. 左下角 **Summary** 框里填：`Initial commit`（第一次提交）。
3. 点蓝色的 **Commit to main** 按钮。

---

## 第 4 步 — 发布到 GitHub（Publish）

1. 顶部中间会出现 **Publish repository**（发布仓库）按钮，点它。
2. 弹窗里：
   - **Name**：`shara-kitchen`（或保持 `Food`，都行）。
   - ⚠️ **取消勾选 "Keep this code private"**（保持代码私有）——
     免费版的网页托管（GitHub Pages）**必须是 Public 公开**。
3. 点 **Publish repository**。
4. 传完后，你的代码就在 github.com 上了。

---

## 第 5 步 — 打开免费网页托管（GitHub Pages）

1. 在 GitHub Desktop 顶部菜单 **Repository → View on GitHub**（在 GitHub 上查看），
   会用浏览器打开你的仓库页面。
2. 仓库页面上方点 **Settings**（设置）。
3. 左侧边栏点 **Pages**。
4. **Source**（来源）选 **Deploy from a branch**（从分支部署）。
5. 下面 **Branch**：第一个下拉选 **main**；旁边文件夹保持 **/ (root)** → 点 **Save**。
6. 等约 **1 分钟**，刷新页面，会出现一行绿字：
   **"Your site is live at https://你的用户名.github.io/shara-kitchen/"**

---

## 第 6 步 — 先在电脑上测试

1. 你的 **app 地址** = 上面那行网址后面加 **`kitchen-app/`**：
   **`https://你的用户名.github.io/shara-kitchen/kitchen-app/`**
2. 在电脑浏览器打开它，应该能看到 **Shara's Kitchen**（搜索框 + 分类卡片）。
   点一个分类、打开一个菜谱，确认能正常显示。
   *（如果显示 404，再等 1 分钟刷新——Pages 首次生效有点慢。）*

---

## 第 7 步 — 装到安卓手机上

1. 手机打开 **Chrome**（第一次安装请用 Chrome）。
2. 输入第 6 步那个 app 地址，打开。
3. 点右上角 **⋮**（三个点）菜单。
4. 点 **添加到主屏幕**（Add to Home screen，有的手机显示 **安装应用 / Install app**）。
5. 确认 **添加 / 安装**。
6. 回到手机主屏，就能看到 **Shara's Kitchen** 图标，点开是全屏的 app。
7. 趁有网,先打开几个菜谱缓存一下,以后**没网也能用**。

🎉 完成——你的菜谱 app 就在手机上了。

---

## 以后怎么更新（非常简单）

1. 直接在 `D:\Claude Projects\Food` 里改文件（或让我帮你改好）。
2. 打开 GitHub Desktop，它会自动在左侧显示改动。
3. 左下角填个 **Summary**（比如 `更新菜谱`）→ 点 **Commit to main**。
4. 右上角点 **Push origin**（推送）。
5. 网站约 1 分钟后更新;手机上的 app 下次打开会自动刷新。

> **新增菜谱**时,还需要重新生成 app 的搜索索引(`python build-index.py`,要电脑装 Python)。
> 到时候直接找我,我帮你重新生成好再让你 Commit + Push。

---

## 遇到问题

- **没看到 "create a repository" 蓝字** → 确认第 2 步选的是 `D:\Claude Projects\Food` 这个文件夹。
- **Publish 时找不到公开选项** → 就是把 **"Keep this code private" 的勾去掉**。
- **Pages 显示 404** → 再等一会;确认 Branch=`main`、Folder=`/ (root)`,而且地址结尾是 `/kitchen-app/`。
- **Chrome 没有"安装"选项** → 确认打开的是 `https://…github.io/…` 这个网址,不是电脑上的文件。
- **任何一步卡住** → 把屏幕上显示的字告诉我,我一步步带你。
