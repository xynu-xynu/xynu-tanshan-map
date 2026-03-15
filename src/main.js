const { createApp } = Vue;

createApp({
  data() {
    return {}
  },
  mounted() {
    this.initMap();
  },
  methods: {
    initMap() {
      // 你原来的地图代码放在这里
      // 示例：
      // const map = new mapboxgl.Map({ ... })
    }
  }
}).mount('#app')