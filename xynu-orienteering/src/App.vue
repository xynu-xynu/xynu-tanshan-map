<template>
  <el-container style="height: 100vh">
    <!-- 顶部导航 -->
    <el-header class="header">
      < img src="https://www.xynu.edu.cn/images/logo.png" alt="信阳师院校徽" style="height: 40px; margin-right: 10px;">
      <span style="font-size: 20px; font-weight: bold">信阳师范大学谭山校区定向越野系统</span>
    </el-header>
    <el-container>
      <!-- 左侧菜单 -->
      <el-aside width="200px" class="aside">
        <el-menu>
          <el-menu-item index="1" @click="buildRoadNet">构建勘测路网</el-menu-item>
          <el-menu-item index="2" @click="genShortestPath">标准最短路径</el-menu-item>
          <el-menu-item index="3" @click="genSlopeAvoidPath">避坡最优路线</el-menu-item>
          <el-menu-item index="4" @click="genCheckPointPath">强制打卡路线</el-menu-item>
        </el-menu>
      </el-aside>
      <!-- 右侧地图容器 -->
      <el-main class="main">
        <div id="map" style="width: 100%; height: 100%"></div>
      </el-main>
    </el-container>
    <!-- 底部状态栏 -->
    <el-footer class="footer">© 2026 信阳师范大学 GIS 学年论文项目</el-footer>
  </el-container>
</template>

<style scoped>
.header { background: #1890ff; color: white; line-height: 60px; padding: 0 20px; }
.aside { background: #f5f7fa; }
.main { padding: 0; }
.footer { text-align: center; background: #f0f2f5; line-height: 40px; }
</style>