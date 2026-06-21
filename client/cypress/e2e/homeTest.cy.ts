describe("homePage Test", () => {
    it("Soft delete button test", () => {
        
        cy.visit("http://localhost:3000/");
        //Have to mock login somehow
        cy.get('[data-testid="cypress-soft-delete-btn"]', {timeout: 10000}).should("exist").should("have.text","Delete");
    });
});