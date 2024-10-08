import { AfterViewInit, Component, HostListener } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import * as echarts from 'echarts';
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CardModule, ButtonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements AfterViewInit {
  private chartInstance!: echarts.ECharts;

  @HostListener('window:resize')
  onResize() {
    if (this.chartInstance) {
      this.chartInstance.resize();
    }
  }
  ngAfterViewInit(): void {
    this.initChart();
  }

  initChart(): void {
    const chartDom = document.getElementById('chart-container')!;
    this.chartInstance = echarts.init(chartDom);

    let base = +new Date(1968, 9, 3);
    let oneDay = 24 * 3600 * 1000;
    let date = [];
    let data = [Math.random() * 300];

    for (let i = 1; i < 20000; i++) {
      let now = new Date((base += oneDay));
      date.push(
        [now.getFullYear(), now.getMonth() + 1, now.getDate()].join('/')
      );
      data.push(Math.round((Math.random() - 0.5) * 20 + data[i - 1]));
    }

    const option = {
      tooltip: {
        trigger: 'axis',
        position: function (pt: any) {
          return [pt[0], '10%'];
        },
      },
      title: {
        left: 'center',
        text: 'Large Area Chart',
      },
      toolbox: {
        feature: {
          dataZoom: {
            yAxisIndex: 'none',
          },
          restore: {},
          saveAsImage: {},
        },
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: date,
      },
      yAxis: {
        type: 'value',
        boundaryGap: [0, '100%'],
      },
      dataZoom: [
        {
          type: 'inside',
          start: 0,
          end: 10,
        },
        {
          start: 0,
          end: 10,
        },
      ],
      series: [
        {
          name: 'Fake Data',
          type: 'line',
          symbol: 'none',
          sampling: 'lttb',
          itemStyle: {
            color: 'rgb(23, 92, 212)',
          },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              {
                offset: 0,
                color: 'rgb(98, 145, 227)',
              },
              {
                offset: 1,
                color: 'rgb(230, 238, 252)',
              },
            ]),
          },
          data: data,
        },
      ],
    };

    this.chartInstance.setOption(option);
  }
}
