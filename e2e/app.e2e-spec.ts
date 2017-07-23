import { KumchurkPage } from './app.po';

describe('kumchurk App', () => {
  let page: KumchurkPage;

  beforeEach(() => {
    page = new KumchurkPage();
  });

  it('should display welcome message', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('Welcome to app!');
  });
});
