import { LightningElement, wire } from 'lwc';
import getYearlyBudget from '@salesforce/apex/GetYearlyBudget.getYearlyBudget';
import { loadScript, loadStyle } from 'lightning/platformResourceLoader';
import ChartJS from '@salesforce/resourceUrl/chartJs';

export default class SavingsChart extends LightningElement {
    chart;
    chartJsInitialized = false;

    @wire(getYearlyBudget)
    wiredBudget({ error, data }) {
        if (data) {
            this.prepareChart(data);
        } else if (error) {
            console.error(error);
        }
    }

    renderedCallback() {
        if (this.chartJsInitialized) {
            return;
        }
        this.chartJsInitialized = true;

        loadScript(this, ChartJS)
            .then(() => {
                console.log('Chart.js loaded');
            })
            .catch(error => {
                console.error('Error loading Chart.js', error);
            });
    }

    prepareChart(data) {
        if (!this.chartJsInitialized) {
            return;
        }

        const labels = data.map(item => {
            const date = new Date(item.Month_Year__c);
            return date.toLocaleString('default', { month: 'short' });
        });
        const remainingBudget = data.map(item => item.Remaining_Budget__c);

        const ctx = this.template.querySelector('canvas.budgetChart').getContext('2d');

        if (this.chart) {
            this.chart.destroy();
        }

        this.chart = new window.Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Remaining Budget (Savings)',
                    data: remainingBudget,
                    backgroundColor: 'rgba(75, 192, 192, 0.6)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }
}