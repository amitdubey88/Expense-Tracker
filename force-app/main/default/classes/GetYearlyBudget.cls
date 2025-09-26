public class GetYearlyBudget {
    @AuraEnabled(cacheable=true)
    public static List<Monthly_Budget__c> getYearlyBudget() {
        Integer currentYear = Datetime.now().year();
        Date firstJan = Date.newInstance(currentYear, 1, 1);

        return [SELECT Id, Name, Remaining_Budget__c, Month_Year__c 
                FROM Monthly_Budget__c 
                WHERE Month_Year__c >= :firstJan 
                ORDER BY Month_Year__c ASC];
    }
}