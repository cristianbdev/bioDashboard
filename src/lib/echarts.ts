import * as echarts from "echarts/core";
import { BarChart, HeatmapChart, PieChart, RadarChart } from "echarts/charts";
import {
  GraphicComponent,
  GridComponent,
  LegendComponent,
  RadarComponent,
  TitleComponent,
  TooltipComponent,
  VisualMapComponent,
} from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";

echarts.use([
  BarChart,
  PieChart,
  HeatmapChart,
  RadarChart,
  TitleComponent,
  TooltipComponent,
  GridComponent,
  VisualMapComponent,
  LegendComponent,
  GraphicComponent,
  RadarComponent,
  CanvasRenderer,
]);

export { echarts };
