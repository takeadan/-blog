# Takeadan Personal Blog

一个轻量静态个人主页博客，包含动态 Canvas 背景、堆叠式文章卡片、文章详情页、项目区和联系区。

## 本地预览

直接打开 `index.html` 即可预览，也可以用任意静态文件服务托管。

## 发布新文章

1. 复制 `posts/template.html`。
2. 把复制出来的文件改成文章名，例如 `posts/my-new-post.html`。
3. 在新文件里修改 `<title>`、文章标题、日期、分类、摘要和正文。
4. 回到 `index.html` 的 `writing` 区域，复制一张文章卡片，改标题、日期、摘要，并把链接改成新文章路径。
5. 提交并推送到 GitHub，GitHub Pages 会自动更新。

## 部署

仓库推送到 GitHub 后，GitHub Actions 会自动发布到 GitHub Pages。
