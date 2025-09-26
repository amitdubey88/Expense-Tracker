import { LightningElement, wire } from 'lwc';
import { loadScript } from 'lightning/platformResourceLoader';
import chartjs from '@salesforce/resourceUrl/chartJs';
import getCategoryWiseMonthlyExpenses from '@salesforce/apex/ExpenseController.getCategoryWiseMonthlyExpenses';

export default class MonthlyCategoryBarChart extends LightningElement {
    chart;
    chartJsInitialized = false;
    rawData = [];

    @wire(getCategoryWiseMonthlyExpenses)
    wiredExpenses({ error, data }) {
        if (data) {
            this.rawData = data;
            this.renderChart();
        } else if (error) {
            console.error(error);
        }
    }

    renderedCallback() {
        if (this.chartJsInitialized) return;
        this.chartJsInitialized = true;

        loadScript(this, chartjs)
            .then(() => this.renderChart())
            .catch(error => console.error('Error loading Chart.js', error));
    }

    renderChart() {
        if (!this.rawData || !this.rawData.length) return;
        if (!this.chartJsInitialized) return;

        // Get all unique categories
        const categories = [...new Set(this.rawData.map(d => d.Category__c))];

        // Map month numbers to names
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const currentMonth = new Date().getMonth();
        const months = [...Array(currentMonth + 1).keys()]; // 0 to currentMonth

        // Calculate total per month
        const monthlyTotals = {};
        this.rawData.forEach(item => {
            const month = new Date(item.Month_Year__c).getMonth();
            if (!monthlyTotals[month]) monthlyTotals[month] = 0;
            monthlyTotals[month] += item.total;
        });

        // Prepare labels including totals
        const labels = months.map(m => `${monthNames[m]} (₹${monthlyTotals[m] || 0})`);

        // Prepare datasets for each category
        const colorPalette = [
            '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
            '#9966FF', '#FF9F40', '#8BC34A', '#E91E63'
        ];

        const datasets = categories.map((cat, idx) => {
            const data = months.map(m => {
                const item = this.rawData.find(d => {
                    const month = new Date(d.Month_Year__c).getMonth();
                    return month === m && d.Category__c === cat;
                });
                return item ? item.total : 0;
            });

            return {
                label: cat,
                data: data,
                backgroundColor: colorPalette[idx % colorPalette.length]
            };
        });

        const ctx = this.template.querySelector('canvas').getContext('2d');
        if (this.chart) this.chart.destroy();

        this.chart = new window.Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Monthly Expenses by Category'
                    },
                    legend: {
                        position: 'right'
                    }
                },
                scales: {
                    x: { stacked: true },
                    y: { stacked: true, beginAtZero: true }
                }
            }
        });
    }

}
