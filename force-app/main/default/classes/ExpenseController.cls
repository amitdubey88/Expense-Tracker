public with sharing class ExpenseController {
	
	@AuraEnabled(cacheable=true)
    public static Id getMonthlyBudgetId(){
        // Get the current date
		Date todaysDate = Date.today();

		// Get the first day of the current month
		Date firstDayOfMonth = todaysDate.toStartOfMonth();

		return [
           SELECT Id
           FROM Monthly_Budget__c 
           WHERE Month_Year__c=:firstDayOfMonth
        ].Id;
    }
    @AuraEnabled(cacheable=true)
    public static List<AggregateResult> getCategoryWiseExpenses(Id monthlyBudgetId) {
        return [
            SELECT Category__c category, SUM(Amount__c) total
            FROM Expense__c 
			WHERE Monthly_Budget__c=:monthlyBudgetId
            GROUP BY Category__c 
        ];
    }

	@AuraEnabled(cacheable=true)
    public static List<AggregateResult> getCategoryWiseMonthlyExpenses() {
        Integer currentYear = Datetime.now().year();
        Date firstJan = Date.newInstance(currentYear, 1, 1);
        Date today = Date.today();

        return [SELECT Category__c, Monthly_Budget__r.Month_Year__c, SUM(Amount__c) total
                FROM Expense__c
                WHERE Monthly_Budget__r.Month_Year__c >= :firstJan AND Monthly_Budget__r.Month_Year__c <= :today
                GROUP BY Monthly_Budget__r.Month_Year__c,Category__c
                ORDER BY Monthly_Budget__r.Month_Year__c ASC];
    }
    @AuraEnabled(cacheable=true)
    public static List<Monthly_Budget__c> getMonthlyBudgets() {
        Integer currentYear = Datetime.now().year();
        Date firstJan = Date.newInstance(currentYear, 1, 1);
    
        return [
            SELECT Id, Name, Month_Year__c 
            FROM Monthly_Budget__c 
            WHERE Month_Year__c >= :firstJan
            ORDER BY Month_Year__c ASC
        ];
    }
	
	@AuraEnabled
    public static List<AggregateResult> getCategoryWiseThisMonthExpenses(Id monthlyBudgetId) {
        if (monthlyBudgetId == null) return new List<AggregateResult>();
    
        return [
            SELECT Category__c, Monthly_Budget__r.Month_Year__c, SUM(Amount__c) total
            FROM Expense__c
            WHERE Monthly_Budget__c = :monthlyBudgetId
            GROUP BY Category__c, Monthly_Budget__r.Month_Year__c
            ORDER BY Monthly_Budget__r.Month_Year__c ASC
        ];
    }
	
	@AuraEnabled(cacheable=true)
    public static List<Expense__c> getExpenses() {
        Id monthlyId=getMonthlyBudgetId();
        return [
            SELECT Id, Expense_Date__c, Amount__c, Category__c, Description__c, Monthly_Budget__r.Month_Year__c
            FROM Expense__c 
            WHERE Monthly_Budget__c=:monthlyId
            ORDER BY Expense_Date__c DESC
        ];
    }

    @AuraEnabled
    public static void deleteExpense(Id expenseId) {
        try {
            delete [SELECT Id FROM Expense__c WHERE Id = :expenseId];
        } catch(Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }
	
    @AuraEnabled(cacheable=true)
    public static List<AggregateResult> getMonthlyExpenseTotals() {
        Integer currentYear = Datetime.now().year();
        Date firstJan = Date.newInstance(currentYear, 1, 1);
        Date today = Date.today();
    
        return [
            SELECT CALENDAR_MONTH(Expense_Date__c) month, SUM(Amount__c) total
            FROM Expense__c
            WHERE Expense_Date__c >= :firstJan AND Expense_Date__c <= :today
            GROUP BY CALENDAR_MONTH(Expense_Date__c)
            ORDER BY CALENDAR_MONTH(Expense_Date__c)
        ];
    }

}