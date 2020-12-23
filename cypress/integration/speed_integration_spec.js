
describe('Start SpeedIntegrationTests', function() {

    it('Loads the dev server page', function() {
        cy.visit("/");
    });

    // Find the Download Progress section.
    it('Progress indicator section present', function() {
        cy.get(".dloadprogress")
            .should('exist');
    })

    // Find the download progress indicator.
    it ('Progress Indicator present', function() {
        cy.get(".dloadprogress")
            .get(".percentlabel")
            .should("exist")
    })

    // Download progress label value not visible on load.
    it ('Progress indicator label value hidden on load', function() {
        cy.get(".dloadprogress")
            .get(".percentlabel")
            .should('be.empty');
    })

    // Test related option box is visible.
    it ('Detect presence of test status options section', function() {
        cy.get(".teststatusoptions")
            .should('be.visible');
    })

    // Test option box constituents.
    // Start test button
    it ('Start test button option', function () {
        cy.get(".teststatusoptions")
            .find('#startTest')
            .should ('exist')
    })

    // Stop test button
    it ('Stop test button option', function() {
        cy.get(".teststatusoptions")
            .find('#stopTest')
            .should('exist')
    })

    // Reset test button
    it ('Reset test button option', function() {
        cy.get(".teststatusoptions")
            .find('#resetTest')
            .should('exist')
    })

    // Export options box
    it ('Export options box', function() {
        cy.get(".teststatusoptions")
            .find('.exportoptions')
            .should('exist')
    })

    // Export as JSON button
    it('Export button', function() {
        cy.get(".teststatusoptions")
            .find('.exportButton')
            .should('exist')
    })
})

describe ('Progress label on start test', function() {
    var startbtn;
    var stopbtn;
    var resetbtn;

    afterEach('Reset test', function() {

        resetbtn = cy.get(".teststatusoptions")
            .find("#resetTest");
        resetbtn.click();
    })

    // Start button should be disabled on start test
    it ('Start button status after start test', function() {
        startbtn = cy.get(".teststatusoptions")
            .find('#startTest')

        startbtn.click();
        cy.waitFor(50);

        startbtn.should('be.disabled');
        stopbtn = cy.get(".teststatusoptions")
            .find("#stopTest")

        resetbtn = cy.get(".teststatusoptions")
            .find("#resetTest")

        stopbtn.should('not.be.disabled');
        resetbtn.should('not.be.disabled');
    })

    // Progress label should not be empty on start test
    it ('Progress label on start test', function() {
        startbtn = cy.get(".teststatusoptions")
            .find('#startTest')

        startbtn.click();
        cy.waitFor(50)

        cy.get(".teststatusoptions")
            .find('.percentlabel')
            .should('not.be.empty')
    })

    // Test the stopTest button
    it('Stop test button behavior', function() {
        startbtn = cy.get(".teststatusoptions")
            .find('#startTest')

        startbtn.click();
        cy.waitFor(50);

        startbtn.should('be.disabled');

        stopbtn = cy.get(".teststatusoptions")
            .find("#stopTest")
        stopbtn.click();
        cy.waitFor(50)

        stopbtn.should('be.disabled');
    })
})