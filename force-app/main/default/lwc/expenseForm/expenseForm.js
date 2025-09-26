import { LightningElement, track, wire } from 'lwc';
import getMonthlyBudgets from '@salesforce/apex/ExpenseController.getMonthlyBudgets';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class ExpenseForm extends LightningElement {
    @track budgetOptions = [];
    selectedBudgetId;

    // Load monthly budgets for combobox
    @wire(getMonthlyBudgets)
    wiredBudgets({ error, data }) {
        if (data) {
            this.budgetOptions = data.map(b => {
                const monthLabel = b.Month_Year__c
                    ? new Date(b.Month_Year__c).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                    : 'Unknown';
                return { label: monthLabel, value: b.Id };
            });

            // default selection
            if (data.length) this.selectedBudgetId = data[0].Id;
        } else if (error) {
            console.error(error);
        }
    }

    handleBudgetChange(event) {
        this.selectedBudgetId = event.detail.value;
    }

    handleError(event) {
        const error = event.detail;
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


    // Intercept form submit to attach the combobox value
    handleSubmit(event) {
        event.preventDefault(); // stop default submit

        const fields = event.detail.fields;
        fields.Monthly_Budget__c = this.selectedBudgetId; // assign combobox selection
        this.template.querySelector('lightning-record-edit-form').submit(fields);
    }

    handleSuccess(event) {
        this.showToast('Success', 'Expense saved successfully! Id: ' + event.detail.id, 'success');
    }

    handleClear() {
        this.template.querySelector('lightning-record-edit-form').reset();
        this.selectedBudgetId = null;
        this.showToast('Info', 'Form cleared', 'info');
    }

    // Utility method for showing toast
    showToast(title, message, variant = 'info') {
        const evt = new ShowToastEvent({
            title: title,
            message: message,
            variant: variant
        });
        this.dispatchEvent(evt);
    }
}
