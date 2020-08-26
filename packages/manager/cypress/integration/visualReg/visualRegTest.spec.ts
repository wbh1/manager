import { waitForAppLoad } from '../../support/ui/common';
import { pages } from '../../support/ui/constants';

describe('Visual regression tests', () => {
  pages.forEach(page => {
    it(`Should match previous screenshot '${page.name} Page'`, () => {
      const events: any = [];
      // let pageLoad = 0;
      cy.wrap(events).as('events');
      cy.server();
      cy.route({
        // Here we handle all requests passing through Cypress' server
        method: 'GET',
        url: '/v4/account/events?page_size=25',
        onRequest: req => {
          events.push(req);
        }
      }).as('eventLoad');
      waitForAppLoad(`/${page.url}`);
      cy.get('@events')
        .its('length')
        .should('be.gte', 3);

      cy.matchImageSnapshot();
    });
    // const waitForPageLoad = () => {
    //   while (events.length < 3 || pageLoad < 3) {
    //     pageLoad++;
    //   }
    //   cy.matchImageSnapshot();
    // };
    // cy.wait('@eventLoad');
    // waitForPageLoad();

    // });
  });
});
