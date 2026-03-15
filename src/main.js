import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css' // 这行是样式关键，不能少！
import App from './App.vue'

const app = createApp(App)
app.use(ElementPlus) // 注册 ElementPlus 组件库
app.mount('#app')