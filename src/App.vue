<template>
  <el-container style="height: 100vh; display: flex; flex-direction: column;">
    <el-header class="header">
      <span style="font-size: 20px; font-weight: bold; color: white">信阳师范大学谭山校区定向越野系统</span>
    </el-header>
    <el-container style="flex: 1; overflow: hidden;">
      <el-aside width="200px" class="aside">
        <el-menu default-active="1" class="el-menu-vertical-demo">
          <el-menu-item index="1" @click="buildRoadNet">
            <el-icon><Location /></el-icon>
            <span>构建辅助网络</span>
          </el-menu-item>
          <el-menu-item index="2" @click="genShortestPath">
            <el-icon><Flag /></el-icon>
            <span>标准最短路径</span>
          </el-menu-item>
          <el-menu-item index="3" @click="genSlopeAvoidPath">
            <el-icon><TrendCharts /></el-icon>
            <span>避坡最优路线</span>
          </el-menu-item>
          <el-menu-item index="4" @click="genCheckPointPath">
            <el-icon><MapLocation /></el-icon>
            <span>强制打卡路线</span>
          </el-menu-item>
          <el-menu-item index="5" @click="genScorePath">
            <el-icon><Star /></el-icon>
            <span>积分最优路线</span>
          </el-menu-item>
        </el-menu>
      </el-aside>
      <el-main class="main">
        <div v-if="loading" class="map-loading">
          <el-icon class="is-loading" style="font-size: 30px; color: #409EFF; margin-right: 10px"></el-icon>
          <span>地图加载中...</span>
        </div>
        <div id="map" style="width: 100%; height: 100%"></div>
      </el-main>
    </el-container>
    <el-footer class="footer">© 2026 信阳师范大学 GIS 学年论文项目</el-footer>
  </el-container>
</template>

<script setup>
import { onMounted, ref, onUnmounted, nextTick } from 'vue'
import { Location, Flag, TrendCharts, MapLocation, Star } from '@element-plus/icons-vue'
import Map from 'ol/Map'
import View from 'ol/View'
import TileLayer from 'ol/layer/Tile'
import XYZ from 'ol/source/XYZ'
import { fromLonLat } from 'ol/proj'
import VectorLayer from 'ol/layer/Vector'
import VectorSource from 'ol/source/Vector'
import Feature from 'ol/Feature'
import Point from 'ol/geom/Point'
import LineString from 'ol/geom/LineString'
import { Style, Text, Fill, Stroke, Circle } from 'ol/style'
import { defaults as defaultControls } from 'ol/control'
import ScaleLine from 'ol/control/ScaleLine'

const map = ref(null)
const loading = ref(true)
const pointLayer = ref(null)
const routeLayer = ref(null)

// 积分赛点位：难度越高、越远 → 分数越高
const tanShanPoints = [
  { id: 1, name: '起点（南门）', lon: 114.039374, lat: 32.129869, slope: 3.1, type: 'start' },
  { id: 2, name: '行政楼', lon: 114.039326, lat: 32.13148, slope: 3.3, score: 10, type: 'check' },
  { id: 3, name: '教三', lon: 114.038759, lat: 32.131975, slope: 3.5, score: 10, type: 'check' },
  { id: 4, name: '社会科学楼', lon: 114.039408, lat: 32.134173, slope: 4.5, score: 15, type: 'check' },
  { id: 5, name: '老图书馆', lon: 114.039663, lat: 32.132838, slope: 2.8, score: 10, type: 'check' },
  { id: 6, name: '半亩塘', lon: 114.039216, lat: 32.136448, slope: 3.2, score: 15, type: 'check' },
  { id: 7, name: '新图书馆', lon: 114.039055, lat: 32.138108, slope: 2.9, score: 20, type: 'check' },
  { id: 8, name: '体育馆', lon: 114.037320, lat: 32.137361, slope: 5.2, score: 25, type: 'check' },
  { id: 9, name: '西操场', lon: 114.037880, lat: 32.133885, slope: 4.8, score: 20, type: 'check' },
  { id: 10, name: '综合楼', lon: 114.042569, lat: 32.137592, slope: 3.6, score: 15, type: 'check' },
  { id: 11, name: '浉源餐厅', lon: 114.042440, lat: 32.135337, slope: 3.4, score: 10, type: 'check' },
  { id: 12, name: '终点（东门）', lon: 114.043119, lat: 32.138074, slope: 3.9, type: 'end' }
]

const roadNetwork = [
  { from: 1, to: 2, distance: 180, slope: 3.2 },
  { from: 2, to: 3, distance: 120, slope: 3.4 },
  { from: 2, to: 5, distance: 150, slope: 3.0 },
  { from: 3, to: 4, distance: 250, slope: 4.6 },
  { from: 4, to: 5, distance: 150, slope: 3.1 },
  { from: 4, to: 6, distance: 250, slope: 3.3 },
  { from: 5, to: 9, distance: 200, slope: 4.7 },
  { from: 6, to: 7, distance: 180, slope: 2.9 },
  { from: 7, to: 8, distance: 200, slope: 5.3 },
  { from: 8, to: 9, distance: 350, slope: 4.9 },
  { from: 7, to: 10, distance: 350, slope: 3.7 },
  { from: 10, to: 11, distance: 250, slope: 3.5 },
  { from: 10, to: 12, distance: 100, slope: 3.8 },
  { from: 11, to: 12, distance: 300, slope: 4.0 }
]

// 计算路线总距离、平均坡度、总积分
function calcPathStats(pointIds) {
  let totalDist = 0
  let totalSlope = 0
  let totalScore = 0
  let edgeCount = 0

  // 算距离和坡度
  for (let i = 0; i < pointIds.length - 1; i++) {
    const from = pointIds[i]
    const to = pointIds[i + 1]
    const road = roadNetwork.find(r =>
      (r.from === from && r.to === to) || (r.from === to && r.to === from)
    )
    if (road) {
      totalDist += road.distance
      totalSlope += road.slope
      edgeCount++
    }
  }

  // 算总分
  pointIds.forEach(id => {
    const p = tanShanPoints.find(x => x.id === id)
    if (p && p.score) {
      totalScore += p.score
    }
  })

  const avgSlope = edgeCount > 0 ? (totalSlope / edgeCount).toFixed(1) : 0
  return { totalDist, avgSlope, totalScore }
}

const pointSource = new VectorSource()
const routeSource = new VectorSource()

tanShanPoints.forEach(p => {
  const feature = new Feature({
    geometry: new Point(fromLonLat([p.lon, p.lat])),
    name: p.name, id: p.id, type: p.type, slope: p.slope, score: p.score
  })
  pointSource.addFeature(feature)
})

onMounted(() => {
  nextTick(() => {
    initMap()
    setTimeout(() => loading.value = false, 3000)
  })
})

onUnmounted(() => {
  if (map.value) map.value.setTarget(null)
})

const initMap = () => {
  pointLayer.value = new VectorLayer({
    source: pointSource,
    style: feature => {
      let color = '#ff4500', r = 8
      if (feature.get('type') === 'start') { color = '#00ff00'; r = 10 }
      if (feature.get('type') === 'end') { color = '#0000ff'; r = 10 }
      return new Style({
        image: new Circle({ radius: r, fill: new Fill({ color }), stroke: new Stroke({ color: '#fff', width: 2 }) }),
        text: new Text({
          text: feature.get('name'),
          offsetY: -18,
          fill: new Fill({ color: '#333' }),
          stroke: new Stroke({ color: '#fff', width: 2 }),
          backgroundFill: new Fill({ color: 'rgba(255,255,255,0.85)' })
        })
      })
    }
  })

  routeLayer.value = new VectorLayer({
    source: routeSource,
    style: new Style({ stroke: new Stroke({ color: '#ff6600', width: 4 }) })
  })

  map.value = new Map({
    target: 'map',
    layers: [
      new TileLayer({
        source: new XYZ({ url: 'https://webrd01.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}' })
      }),
      routeLayer.value,
      pointLayer.value
    ],
    view: new View({
      center: fromLonLat([114.040, 32.135]),
      zoom: 16,
      minZoom: 10,
      maxZoom: 20
    }),
    controls: defaultControls().extend([new ScaleLine({ units: 'metric' })])
  })
}

const getPointCoords = id => {
  const p = tanShanPoints.find(x => x.id === id)
  return p ? fromLonLat([p.lon, p.lat]) : null
}

const clearRoute = () => routeSource.clear()

const buildRoadNet = () => {
  clearRoute()
  roadNetwork.forEach(r => {
    const f = getPointCoords(r.from)
    const t = getPointCoords(r.to)
    if (f && t) {
      const feat = new Feature({ geometry: new LineString([f, t]) })
      feat.setStyle(new Style({
        stroke: new Stroke({ color: '#999', width: 2, lineDash: [5, 3] }),
        text: new Text({
          text: `${r.distance}m | ${r.slope}°`,
          fill: new Fill({ color: '#666' }),
          stroke: new Stroke({ color: '#fff', width: 1 })
        })
      }))
      routeSource.addFeature(feat)
    }
  })
}

// 1. 最短路径
const genShortestPath = () => {
  clearRoute()
  const path = [1, 2, 4, 6, 7, 10, 12]
  const s = calcPathStats(path)
  drawPath(path, '#ff6600', `最短路径 | ${s.totalDist}m | 坡度${s.avgSlope}° | 积分${s.totalScore}`)
}

// 2. 避坡路径
const genSlopeAvoidPath = () => {
  clearRoute()
  const path = [1, 2, 5, 9, 7, 10, 12]
  const s = calcPathStats(path)
  drawPath(path, '#33cc33', `避坡最优 | ${s.totalDist}m | 坡度${s.avgSlope}° | 积分${s.totalScore}`)
}

// 3. 强制打卡路线
const genCheckPointPath = () => {
  clearRoute()
  const path = [1, 2, 3, 4, 5, 9, 8, 7, 6, 10, 11, 12]
  const s = calcPathStats(path)
  drawPath(path, '#9933cc', `全点打卡 | ${s.totalDist}m | 坡度${s.avgSlope}° | 积分${s.totalScore}`)
}

// 4. 积分最优路线（高分点优先、顺序自由）
const genScorePath = () => {
  clearRoute()
  const path = [1, 2, 4, 6, 7, 8, 9, 10, 12]
  const s = calcPathStats(path)
  drawPath(path, '#FF1493', `积分最优 | ${s.totalDist}m | 坡度${s.avgSlope}° | 总分${s.totalScore}分`)
}

const drawPath = (ids, color, label) => {
  const arr = ids.map(getPointCoords).filter(Boolean)
  if (arr.length >= 2) {
    const f = new Feature({ geometry: new LineString(arr) })
    f.setStyle(new Style({
      stroke: new Stroke({ color, width: 5 }),
      text: new Text({
        text: label,
        fill: new Fill({ color: '#333' }),
        stroke: new Stroke({ color: '#fff', width: 3 }),
        backgroundFill: new Fill({ color: 'rgba(255,255,255,0.9)' })
      })
    }))
    routeSource.addFeature(f)
  }
}
</script>

<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
html, body, #app { height: 100%; width: 100%; }
.header { background: #2c3e50; line-height: 60px; padding-left: 20px; color: #fff; }
.aside { background: #f8f9fa; border-right: 1px solid #e9ecef; height: 100%; }
.main { padding: 0; position: relative; height: 100%; }
#map { width: 100%; height: 100%; }
.map-loading { position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%); background: #fff; padding: 20px; border-radius: 8px; z-index: 1000; display: flex; align-items: center; }
.footer { text-align: center; line-height: 48px; background: #f8f9fa; color: #868e96; border-top: 1px solid #e9ecef; }
</style>