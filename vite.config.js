import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue' // 如果是 Vue 项目才需要，React/纯JS项目可以删掉

export default defineConfig({
  // 关键配置：和你的 GitHub 仓库名完全一致
  base: '/xynu-tanshan-map/',

  // 插件配置（根据你的项目类型保留，Vue 项目留着，其他项目可删除）
  plugins: [vue()],

  // 可选：开发服务器配置（本地调试用）
  server: {
    port: 3000,
    open: true
  },

  // 可选：构建输出配置（默认就是 dist，一般不用改）
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  }
})