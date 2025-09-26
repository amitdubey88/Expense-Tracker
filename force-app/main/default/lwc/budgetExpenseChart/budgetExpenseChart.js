import { LightningElement, track, wire } from 'lwc';
import { loadScript } from 'lightning/platformResourceLoader';
import chartjs from '@salesforce/resourceUrl/chartJs';
import getMonthlyBudgets from '@salesforce/apex/ExpenseController.getMonthlyBudgets';
import getCategoryWiseMonthlyExpenses from '@salesforce/apex/ExpenseController.getCategoryWiseThisMonthExpenses';

export default class BudgetExpenseChart extends LightningElement {
    @track budgetOptions = [];
    selectedBudgetId;
    rawData = [];
    chart;
    chartJsInitialized = false;

    // Load monthly budgets for combobox
    @wire(getMonthlyBudgets)
    wiredBudgets({ error, data }) {
        if (data) {
            this.budgetOptions = data.map(b => ({
                label: b.Month_Year__c
                    ? new Date(b.Month_Year__c).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                    : b.Name,
                value: b.Id
            }));
            if (data.length) this.selectedBudgetId = data[0].Id;
            this.fetchExpenses();
        } else if (error) {
            console.error(error);
        }
    }

    // Handle combobox change
    handleBudgetChange(event) {
        this.selectedBudgetId = event.detail.value;
        this.fetchExpenses();
    }

    // Fetch expenses for selected budget
    fetchExpenses() {
        if (!this.selectedBudgetId) return;

        getCategoryWiseMonthlyExpenses({ monthlyBudgetId: this.selectedBudgetId })
            .then(data => {
                this.rawData = data;
                this.renderChart();
            })
            .catch(error => console.error(error));
    }

    renderedCallback() {
        if (this.chartJsInitialized) return;
        this.chartJsInitialized = true;

        loadScript(this, chartjs)
            .then(() => {
                if (this.selectedBudgetId) this.fetchExpenses();
            })
            .catch(error => console.error('Error loading Chart.js', error));
    }

    renderChart() {
        if (!this.rawData || !this.rawData.length) return;
        if (!this.chartJsInitialized) return;

        // Get all categories
        const categories = [...new Set(this.rawData.map(d => d.Category__c))];

        // Use Month_Year__c from the selected budget for x-axis label
        const monthLabel = this.rawData[0].Month_Year__c
            ? new Date(this.rawData[0].Month_Year__c)
            : null;

        const monthName = monthLabel
            ? monthLabel.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
            : 'Selected Month';

        // Prepare datasets
        const colorPalette = [
            '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#8BC34A', '#E91E63'
        ];

        const datasets = categories.map((cat, idx) => {
            const item = this.rawData.find(d => d.Category__c === cat);
            return {
                label: cat,
                data: [item ? item.total : 0],
                backgroundColor: colorPalette[idx % colorPalette.length]
            };
        });

        const ctx = this.template.querySelector('canvas').getContext('2d');
        if (this.chart) this.chart.destroy();

        this.chart = new window.Chart(ctx, {
            type: 'bar',
            data: {
                labels: [monthName], // X-axis shows month name
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: { display: true, text: 'Expenses by Category' },
                    legend: { position: 'right' }
                },
                scales: {
                    x: { stacked: true },
                    y: { stacked: true, beginAtZero: true }
                }
            }
        });
    }
}
