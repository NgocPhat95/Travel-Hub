import { Component, Input, OnChanges, SimpleChanges, ElementRef, ViewChild, PLATFORM_ID, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { MonthAnalytics } from '../../../core/services/business.service';

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './analytics.component.html',
  styleUrl: './analytics.component.scss',
})
export class AnalyticsComponent implements OnChanges {
  private readonly platformId = inject(PLATFORM_ID);

  @Input({ required: true }) data: MonthAnalytics[] = [];

  @ViewChild('chartCanvas', { static: false }) chartCanvas!: ElementRef<HTMLCanvasElement>;

  private chart: any = null;

  ngOnChanges(changes: SimpleChanges) {
    if (isPlatformBrowser(this.platformId) && changes['data']) {
      setTimeout(() => {
        this.renderChart();
      }, 50);
    }
  }

  private async renderChart() {
    if (!this.chartCanvas) return;

    const { Chart, registerables } = await import('chart.js');
    Chart.register(...registerables);

    if (this.chart) {
      this.chart.destroy();
    }

    if (this.data.length === 0) return;

    const labels = this.data.map((d) => d.month);
    const views = this.data.map((d) => d.views);
    const clicks = this.data.map((d) => d.clicks);
    const reviews = this.data.map((d) => d.reviews);

    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    // Create Indigo-Cyan Gradient for the bar charts
    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, '#6366f1'); // Indigo
    gradient.addColorStop(1, '#01FCEF'); // Cyan

    this.chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            type: 'line',
            label: 'Lượt xem (Unique Views)',
            data: views,
            borderColor: '#6366f1',
            borderWidth: 3,
            fill: false,
            tension: 0.4, // smooth curve
            pointBackgroundColor: '#ffffff',
            pointBorderColor: '#6366f1',
            pointBorderWidth: 2.5,
            pointRadius: 5,
            yAxisID: 'yViews',
          },
          {
            type: 'bar',
            label: 'Lượt Click Affiliate',
            data: clicks,
            backgroundColor: gradient,
            hoverBackgroundColor: '#01FCEF',
            borderRadius: 6,
            yAxisID: 'yClicks',
          },
          {
            type: 'bar',
            label: 'Đánh giá mới',
            data: reviews,
            backgroundColor: '#cbd5e1', // Light slate
            borderRadius: 6,
            yAxisID: 'yClicks',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: {
              font: {
                family: "'Inter', sans-serif",
                weight: 'bold',
                size: 11,
              },
              color: '#475569',
            },
          },
          tooltip: {
            padding: 12,
            cornerRadius: 12,
            backgroundColor: 'rgba(15, 23, 42, 0.9)',
          },
        },
        scales: {
          x: {
            grid: {
              display: false,
            },
            ticks: {
              font: {
                family: "'Inter', sans-serif",
                weight: 'bold',
                size: 11,
              },
              color: '#64748b',
            },
          },
          yViews: {
            type: 'linear',
            position: 'left',
            grid: {
              color: '#f1f5f9',
            },
            ticks: {
              font: {
                family: "'Inter', sans-serif",
                weight: 'bold',
              },
              color: '#6366f1',
            },
            title: {
              display: true,
              text: 'Lượt xem',
              color: '#6366f1',
              font: {
                weight: 'bold',
              },
            },
          },
          yClicks: {
            type: 'linear',
            position: 'right',
            grid: {
              drawOnChartArea: false, // only grid lines from views axis
            },
            ticks: {
              font: {
                family: "'Inter', sans-serif",
                weight: 'bold',
              },
              color: '#0ea5e9',
            },
            title: {
              display: true,
              text: 'Clicks & Đánh giá',
              color: '#0ea5e9',
              font: {
                weight: 'bold',
              },
            },
          },
        },
      },
    });
  }
}
