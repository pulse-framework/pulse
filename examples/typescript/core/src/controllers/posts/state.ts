import App from '../../app';

export const collection = App.Collection()(Collection => ({
  groups: {
    FEED: Collection.Group()
  }
}));
