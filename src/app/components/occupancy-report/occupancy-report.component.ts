import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { StatisticsService, OccupancyStatistics, DayOccupancy } from '../../services/statistics.service';

Chart.register(...registerables);

@Component({
  selector: 'app-occupancy-report',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './occupancy-report.component.html',
  styleUrls: ['./occupancy-report.component.scss']
})
export class OccupancyReportComponent implements OnInit {
  
  // Dati statistiche
  statistics: OccupancyStatistics | null = null;
  loading = false;
  error: string | null = null;

  // Filtri periodo
  startDate: string = '';
  endDate: string = '';
  quickPeriod: 'custom' | 'today' | 'week' | 'month' = 'week';

  // Charts
  private dailyOccupancyChart: Chart | null = null;
  private occupancyTrendChart: Chart | null = null;
  private floorComparisonChart: Chart | null = null;

  constructor(private statisticsService: StatisticsService) {
    // Inizializza date di default (ultima settimana)
    const today = new Date();
    this.endDate = this.formatDate(today);
    
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);
    this.startDate = this.formatDate(lastWeek);
  }

  ngOnInit(): void {
    this.loadStatistics();
  }

  /**
   * Carica le statistiche in base al periodo selezionato
   */
  loadStatistics(): void {
    this.loading = true;
    this.error = null;

    let statisticsObservable;

    switch (this.quickPeriod) {
      case 'today':
        statisticsObservable = this.statisticsService.getTodayStatistics();
        break;
      case 'week':
        statisticsObservable = this.statisticsService.getCurrentWeekStatistics();
        break;
      case 'month':
        statisticsObservable = this.statisticsService.getCurrentMonthStatistics();
        break;
      case 'custom':
        statisticsObservable = this.statisticsService.getOccupancyStatistics(
          this.startDate,
          this.endDate
        );
        break;
    }

    statisticsObservable.subscribe({
      next: (data) => {
        this.statistics = data;
        this.loading = false;
        
        // Aggiorna i grafici
        setTimeout(() => {
          this.renderCharts();
        }, 100);
      },
      error: (err) => {
        this.error = 'Errore nel caricamento delle statistiche: ' + err.message;
        this.loading = false;
        console.error('Errore caricamento statistiche:', err);
      }
    });
  }

  /**
   * Cambia il periodo veloce
   */
  onQuickPeriodChange(): void {
    if (this.quickPeriod !== 'custom') {
      this.loadStatistics();
    }
  }

  /**
   * Applica filtro personalizzato
   */
  applyCustomFilter(): void {
    if (this.startDate && this.endDate) {
      this.quickPeriod = 'custom';
      this.loadStatistics();
    }
  }

  /**
   * Renderizza tutti i grafici
   */
  private renderCharts(): void {
    if (!this.statistics) return;

    this.renderDailyOccupancyChart();
    this.renderOccupancyTrendChart();
    this.renderFloorComparisonChart();
  }

  /**
   * Grafico a barre: Occupazione giornaliera
   */
  private renderDailyOccupancyChart(): void {
    const canvas = document.getElementById('dailyOccupancyChart') as HTMLCanvasElement;
    if (!canvas || !this.statistics) return;

    // Distruggi grafico precedente
    if (this.dailyOccupancyChart) {
      this.dailyOccupancyChart.destroy();
    }

    const workingDays = this.statistics.dailyOccupancy.filter(d => !d.isHoliday);
    const labels = workingDays.map(d => this.formatDateLabel(d.date, d.dayOfWeek));
    const occupiedData = workingDays.map(d => d.occupiedDesks);
    const freeData = workingDays.map(d => d.freeDesks);

    const config: ChartConfiguration = {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Postazioni Occupate',
            data: occupiedData,
            backgroundColor: 'rgba(54, 162, 235, 0.7)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1
          },
          {
            label: 'Postazioni Libere',
            data: freeData,
            backgroundColor: 'rgba(75, 192, 192, 0.7)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Occupazione Giornaliera',
            font: { size: 16 }
          },
          legend: {
            position: 'top'
          }
        },
        scales: {
          x: {
            stacked: true
          },
          y: {
            stacked: true,
            beginAtZero: true,
            title: {
              display: true,
              text: 'Numero Postazioni'
            }
          }
        }
      }
    };

    this.dailyOccupancyChart = new Chart(canvas, config);
  }

  /**
   * Grafico a linea: Trend percentuale occupazione
   */
  private renderOccupancyTrendChart(): void {
    const canvas = document.getElementById('occupancyTrendChart') as HTMLCanvasElement;
    if (!canvas || !this.statistics) return;

    if (this.occupancyTrendChart) {
      this.occupancyTrendChart.destroy();
    }

    const workingDays = this.statistics.dailyOccupancy.filter(d => !d.isHoliday);
    const labels = workingDays.map(d => this.formatDateLabel(d.date, d.dayOfWeek));
    const occupancyRates = workingDays.map(d => d.occupancyRate);

    const config: ChartConfiguration = {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Tasso di Occupazione (%)',
            data: occupancyRates,
            borderColor: 'rgba(255, 99, 132, 1)',
            backgroundColor: 'rgba(255, 99, 132, 0.2)',
            tension: 0.4,
            fill: true
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Trend Occupazione (%)',
            font: { size: 16 }
          },
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            title: {
              display: true,
              text: 'Percentuale (%)'
            }
          }
        }
      }
    };

    this.occupancyTrendChart = new Chart(canvas, config);
  }

  /**
   * Grafico a torta: Confronto occupazione tra piani
   */
  private renderFloorComparisonChart(): void {
    const canvas = document.getElementById('floorComparisonChart') as HTMLCanvasElement;
    if (!canvas || !this.statistics) return;

    if (this.floorComparisonChart) {
      this.floorComparisonChart.destroy();
    }

    const labels = this.statistics.floorStatistics.map(f => f.floorName);
    const data = this.statistics.floorStatistics.map(f => f.averageOccupancyRate);

    const config: ChartConfiguration = {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Occupazione Media (%)',
            data: data,
            backgroundColor: [
              'rgba(255, 99, 132, 0.7)',
              'rgba(54, 162, 235, 0.7)',
              'rgba(255, 206, 86, 0.7)',
              'rgba(75, 192, 192, 0.7)',
              'rgba(153, 102, 255, 0.7)'
            ],
            borderColor: [
              'rgba(255, 99, 132, 1)',
              'rgba(54, 162, 235, 1)',
              'rgba(255, 206, 86, 1)',
              'rgba(75, 192, 192, 1)',
              'rgba(153, 102, 255, 1)'
            ],
            borderWidth: 1
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Occupazione Media per Piano',
            font: { size: 16 }
          },
          legend: {
            position: 'right'
          }
        }
      }
    };

    this.floorComparisonChart = new Chart(canvas, config);
  }

  /**
   * Formatta la data per il display
   */
  private formatDateLabel(dateString: string, dayOfWeek: string): string {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    return `${day}/${month} (${dayOfWeek.substring(0, 3)})`;
  }

  /**
   * Formatta data in formato YYYY-MM-DD
   */
  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Esporta report in CSV
   */
  exportToCSV(): void {
    if (!this.statistics) return;

    let csv = 'Data,Giorno,Postazioni Occupate,Postazioni Libere,Tasso Occupazione (%)\n';

    this.statistics.dailyOccupancy.forEach(day => {
      csv += `${day.date},${day.dayOfWeek},${day.occupiedDesks},${day.freeDesks},${day.occupancyRate}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report-occupazione-${this.statistics.startDate}-${this.statistics.endDate}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }
}
