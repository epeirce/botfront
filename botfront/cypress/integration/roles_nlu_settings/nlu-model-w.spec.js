/* eslint-disable no-undef */

const email = 'nlumodelw@test.ia';

describe('nlu-model:w role permissions', function() {
    before(function() {
        cy.fixture('bf_project_id.txt').as('bf_project_id');
        cy.fixture('bf_model_id.txt').as('bf_model_id');
        cy.login();
        cy.get('@bf_project_id').then((id) => {
            cy.createUser('nlu-model:w', email, ['nlu-model:w'], id);
        });
        cy.logout();
    });

    beforeEach(function() {
        cy.loginTestUser(email);
    });

    after(function() {
        cy.deleteUser(email);
    });

    it('should show NEW MODEL button', function() {
        cy.visit(`/project/${this.bf_project_id}/nlu/models`);
        cy.get('[data-cy=new-model]').should('exist');
    });

    it('should show DUPLICATE button', function() {
        cy.visit(`/project/${this.bf_project_id}/nlu/models`);
        cy.contains('English').click();
        cy.get('.cards>:first-child button.secondary').should('exist');
    });

    it('should NOT disable online button', function() {
        cy.visit(`/project/${this.bf_project_id}/nlu/models`);
        cy.contains('English').click();
        cy.get('.cards>:first-child button.right.floated').should('not.have.class', 'disabled');
    });

    // This tests inserting and duplicating since they use the same method
    it('should be able to insert and delete a model through Meteor.call', function() {
        // First a model needs to be created which would then be deleted by nlu-model:w
        cy.MeteorCall('nlu.insert', [
            {
                evaluations: [],
                language: 'en',
                name: 'To be deleted by model:w',
                published: false,
            },
            this.bf_project_id,
        ]) // returns modelId when resolved
            .then(modelId => cy.MeteorCall('nlu.remove', [
                modelId,
                this.bf_project_id,
            ])) // returns string 'Model Deleted' when resolved
            .then((result) => {
                expect(result).to.equal('Model Deleted');
            });
    });

    it('should be able to delete a model through UI', function () {
        cy.visit(`/project/${this.bf_project_id}/nlu/model/${this.bf_model_id}`);
        cy.get('.nlu-menu-settings').click();
        cy.contains('Delete').click();
        cy.get('[data-cy=download-backup]').click();
        cy.get('[data-cy=delete-model]').click();
        cy.get('.primary').click();
        cy.visit(`/project/${this.bf_project_id}/nlu/models`);
        cy.get('.card').should('not.exist');
        cy.insertGenericNLUModel(this.bf_model_id, this.bf_project_id);
        cy.visit(`/project/${this.bf_project_id}/nlu/model/${this.bf_model_id}`);
    });

    it('should be able to call allowed methods', function() {
        cy.MeteorCall('nlu.publish', [
            this.bf_model_id,
            this.bf_project_id,
        ]).then(err => expect(err.error).to.not.equal('403'));
    });
});
