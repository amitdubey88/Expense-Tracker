import { LightningElement, wire } from 'lwc';
import { loadScript } from 'lightning/platformResourceLoader';
import chartjs from '@salesforce/resourceUrl/chartJs';
import getCategoryWiseExpenses from '@salesforce/apex/ExpenseController.getCategoryWiseExpenses';
import getMonthlyBudgetId from '@salesforce/apex/ExpenseController.getMonthlyBudgetId';

export default class ExpenseCategoryChart extends LightningElement {
    chart;
    chartJsInitialized = false;
    chartData = [];
    monthlyBudgetId;

    @wire(getMonthlyBudgetId)
    wiredMonthlyBudget({ error, data }) {
        if (data) {
            this.monthlyBudgetId = data;
        } else if (error) {
            console.error(error);
        }
    }

    @wire(getCategoryWiseExpenses, { monthlyBudgetId: '$monthlyBudgetId' })
    wiredExpenses({ error, data }) {
        if (data) {
            this.chartData = data.map(item => ({
                category: item.category,
                total: item.total
            }));
            this.renderChart();
        } else if (error) {
            console.error(error);
        }
    }

    renderedCallback() {
        if (this.chartJsInitialized) {
            return;
        }
        this.chartJsInitialized = true;

        loadScript(this, chartjs)
            .then(() => {
                this.renderChart();
            })
            .catch(error => {
                console.error('Error loading Chart.js', error);
            });
    }

    renderChart() {
        if (!this.chartData || !this.chartData.length) return;

        const ctx = this.template.querySelector('canvas').getContext('2d');

        if (this.chart) {
            this.chart.destroy();
        }

        this.chart = new window.Chart(ctx, {
            type: 'pie',
            data: {
                labels: this.chartData.map(d => d.category),
                datasets: [{
                    data: this.chartData.map(d => d.total),
                    backgroundColor: [
                        '#FF6384', '#36A2EB', '#FFCE56',
                        '#4BC0C0', '#9966FF', '#FF9F40',
                        '#8BC34A', '#E91E63'
                    ]
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'right',
                    },
                    title: {
                        display: true,
                        text: 'Expenses by Category for Current Month'
                    }
                }
            }
        });
    }
}
