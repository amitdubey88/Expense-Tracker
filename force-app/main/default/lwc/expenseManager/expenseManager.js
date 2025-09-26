import { LightningElement, track, wire } from 'lwc';
import { loadScript } from 'lightning/platformResourceLoader';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import chartJs from '@salesforce/resourceUrl/chartJs';
import getExpenses from '@salesforce/apex/ExpenseController.getExpenses';
import deleteExpense from '@salesforce/apex/ExpenseController.deleteExpense';
import getMonthlyExpenseTotals from '@salesforce/apex/ExpenseController.getMonthlyExpenseTotals';

export default class ExpenseManager extends LightningElement {
    @track expenses;
    @track isLoading = true;
    @track isEditModalOpen = false;
    @track selectedRecordId;

    chart;
    chartJsInitialized = false;

    columns = [
        { label: 'Date', fieldName: 'Expense_Date__c', type: 'date' },
        { label: 'Amount', fieldName: 'Amount__c', type: 'currency' },
        { label: 'Category', fieldName: 'Category__c', type: 'text' },
        { label: 'Description', fieldName: 'Description__c', type: 'text' },
        { label: 'Budget Month', fieldName: 'BudgetMonth', type: 'text' },
        {
            type: 'action',
            typeAttributes: {
                rowActions: [
                    { label: 'Edit', name: 'edit' },
                    { label: 'Delete', name: 'delete' }
                ]
            }
        }
    ];

    // Load Expenses for datatable
    @wire(getExpenses)
    wiredExpenses({ error, data }) {
        this.isLoading = true;
        if (data) {
            this.expenses = data.map(exp => ({
                ...exp,
                BudgetMonth: exp.Monthly_Budget__r ? new Date(exp.Monthly_Budget__r.Month_Year__c).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : ''
            }));
        } else if (error) {
            this.handleError(error);
        }
        this.isLoading = false;
    }

    // Load Chart.js
    renderedCallback() {
        if (this.chartJsInitialized) return;
        this.chartJsInitialized = true;

        loadScript(this, chartJs)
            .then(() => this.loadChartData())
            .catch(error => this.handleError(error));
    }

    loadChartData() {
        getMonthlyExpenseTotals()
            .then(data => {
                const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                const labels = monthNames.slice(0, new Date().getMonth() + 1); // months till current
                const totals = Array(labels.length).fill(0);

                data.forEach(d => {
                    const monthIndex = Number(d.month) - 1;
                    totals[monthIndex] = d.total;
                });

                const ctx = this.template.querySelector('canvas.expense-chart').getContext('2d');

                if (this.chart) this.chart.destroy();

                this.chart = new window.Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: labels,
                        datasets: [{
                            label: 'Total Expenses',
                            data: totals,
                            borderColor: '#36A2EB',
                            backgroundColor: 'rgba(54,162,235,0.2)',
                            fill: true,
                            tension: 0.3
                        }]
                    },
                    options: {
                        responsive: true,
                        plugins: {
                            legend: { position: 'top' },
                            title: { display: true, text: 'Monthly Expenses for Current Year' }
                        },
                        scales: {
                            y: { beginAtZero: true }
                        }
                    }
                });
            })
            .catch(error => this.handleError(error));
    }

    handleRowAction(event) {
        const actionName = event.detail.action.name;
        const row = event.detail.row;

        if (actionName === 'edit') {
            this.selectedRecordId = row.Id;
            this.isEditModalOpen = true;
        } else if (actionName === 'delete') {
            this.deleteRecord(row.Id);
        }
    }

    deleteRecord(recordId) {
        if (confirm('Are you sure you want to delete this expense?')) {
            deleteExpense({ expenseId: recordId })
                .then(() => {
                    this.showToast('Success', 'Expense deleted successfully', 'success');
                    return getExpenses();
                })
                .then(data => {
                    this.expenses = data.map(exp => ({
                        ...exp,
                        BudgetMonth: exp.Monthly_Budget__r ? new Date(exp.Monthly_Budget__r.Month_Year__c).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : ''
                    }));
                    this.loadChartData(); // refresh chart
                })
                .catch(error => this.handleError(error));
        }
    }

    handleEditSuccess() {
        this.showToast('Success', 'Expense updated successfully', 'success');
        this.isEditModalOpen = false;
        return getExpenses()
            .then(data => {
                this.expenses = data.map(exp => ({
                    ...exp,
                    BudgetMonth: exp.Monthly_Budget__r ? new Date(exp.Monthly_Budget__r.Month_Year__c).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : ''
                }));
                this.loadChartData(); // refresh chart
            });
    }

    closeEditModal() {
        this.isEditModalOpen = false;
        this.selectedRecordId = null;
    }

    handleError(error) {
        let message = 'Unknown error';
        if (Array.isArray(error.body)) {
            message = error.body.map(e => e.message).join(', ');
        } else if (error.body && error.body.message) {
            message = error.body.message;
        } else if (error.message) {
            message = error.message;
        }
        this.showToast('Error', message, 'error');
    }

    showToast(title, message, variant = 'info') {
        const evt = new ShowToastEvent({ title, message, variant });
        this.dispatchEvent(evt);
    }
}
