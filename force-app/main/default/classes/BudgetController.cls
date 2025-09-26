public with sharing class BudgetController {

    @AuraEnabled(cacheable=true)
    public static List<Monthly_Budget__c> getYearlyBudgets() {
        Integer currentYear = Date.today().year();
        Date firstJan = Date.newInstance(currentYear, 1, 1);

        return [
            SELECT Id, Name, Month_Year__c, Remaining_Budget__c, Budgeted_Amount__c
            FROM Monthly_Budget__c
            WHERE Month_Year__c >= :firstJan
            ORDER BY Month_Year__c ASC
        ];
    }

    @AuraEnabled
    public static void deleteBudget(Id budgetId) {
        delete [SELECT Id FROM Monthly_Budget__c WHERE Id = :budgetId];
    }
}