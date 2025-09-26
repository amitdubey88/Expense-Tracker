import { LightningElement, wire, track } from 'lwc';
import getYearlyBudgets from '@salesforce/apex/BudgetController.getYearlyBudgets';
import deleteBudget from '@salesforce/apex/BudgetController.deleteBudget';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { refreshApex } from '@salesforce/apex';

export default class BudgetManager extends LightningElement {
    @track budgets = [];
    wiredBudgets;
    isModalOpen = false;
    selectedBudgetId;

    columns = [
        { label: 'Month', fieldName: 'monthLabel' },
        { label: 'Total Budget', fieldName: 'Budgeted_Amount__c', type: 'currency' },
        { label: 'Remaining Budget', fieldName: 'Remaining_Budget__c', type: 'currency' },
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

    @wire(getYearlyBudgets)
    wiredBudgetData(result) {
        this.wiredBudgets = result;
        if (result.data) {
            this.budgets = result.data.map(b => ({
                ...b,
                monthLabel: b.Month_Year__c
                    ? new Date(b.Month_Year__c).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                    : b.Name
            }));
        } else if (result.error) {
            this.showToast('Error', 'Failed to load budgets', 'error');
        }
    }

    handleRowAction(event) {
        const action = event.detail.action.name;
        const row = event.detail.row;

        if (action === 'edit') {
            this.selectedBudgetId = row.Id;
            this.isModalOpen = true;
        } else if (action === 'delete') {
            this.handleDelete(row.Id);
        }
    }

    async handleDelete(budgetId) {
        try {
            await deleteBudget({ budgetId });
            this.showToast('Success', 'Budget deleted successfully', 'success');
            refreshApex(this.wiredBudgets);
        } catch (error) {
            this.showToast('Error deleting budget', error.body.message, 'error');
        }
    }

    handleEditSuccess() {
        this.showToast('Success', 'Budget updated successfully', 'success');
        this.closeModal();
        refreshApex(this.wiredBudgets);
    }

    handleEditError(event) {
        this.showToast('Error updating budget', event.detail.message, 'error');
    }

    closeModal() {
        this.isModalOpen = false;
        this.selectedBudgetId = null;
    }

    showToast(title, message, variant) {
        this.dispatchEvent(new ShowToastEvent({ title, message, variant }));
    }
}
