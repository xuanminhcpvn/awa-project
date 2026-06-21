import Login from "../../src/components/Login"; 
import Register from "../../src/components/Register"; 
//Sources:
// Tutorialspoint https://www.tutorialspoint.com/cypress/cypress_build_first_test.htm
// Cypress docs: https://docs.cypress.io/app/component-testing/react/examples

//test suite
//to run npx cypress run --component  
describe("Authentication Unit Tests (Cypress)", () => {
    it("Check that all components in login page exists ", () => {
        cy.mount(<Login />);
        cy.contains("Login").should("exist");// Find button with text "Login"
        cy.get('input[placeholder="Username"]').should("exist");
        cy.get('input[placeholder="Password"]').should("exist");
    });

    it("Check that all components in register page exists ", () => {
        cy.mount(<Register />);
        cy.contains("Register").should("exist");
        cy.get('input[placeholder="Username"]').should("exist");
        cy.get('input[placeholder="Email"]').should("exist");
        cy.get('input[placeholder="Password"]').should("exist");
    });
    //https://www.tutorialspoint.com/cypress/cypress_get_and_post.htm
    //https://learn.cypress.io/cypress-fundamentals/waiting-and-retry-ability
    it("Register route response and request are correct and registeration successful", function () {
    //Can't get intercept to work properly => so I used this cy.request() method
    cy.request("POST", "http://localhost:3000/api/user/register", {
      username: "john",
      email: "john@mail.com",
      password: "123456",
    }).then((r) => {
      expect(r.status).to.eq(200)
      expect(r.body).to.have.property("message")||expect(r.body).to.have.property("token");
    });
    });

    it("Register route response and request are correct and login successful", function () {
    cy.request("POST", "http://localhost:3000/api/user/login", {
      username: "john",
      password: "123456",
    }).then((r) => {
      expect(r.status).to.eq(200);
      expect(r.body.token !== undefined || r.body.message !== undefined).to.eq(true);
    });
    });

    it("Redirects after login", () => {
        cy.mount(<Login />);
        cy.contains("Login").click();
        cy.window().its("location.href").should("include", "/");
    });

})