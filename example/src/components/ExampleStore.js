// This example shows a simplified useage example of the store with a "collection"
import Store from 'icantthinkofanameyet'
// define the collection class in a constant
const Collection = Store.Collection

// Collections are like modules in vuex but behave more like a mongo database
const channels = new Collection({
    // every collection offers local state for casual use
    state: {
        // best used for booleans and small data
        channelOpen: false
    },
    // Defining a model can act as layer of validation, but can also be used for reactive relations
    // every model should have a primary key set, as this is used to store the data
    model: {
        id: {
            // a primary key is required 
            primaryKey: true
        },
        displayName: {
            // Setting a type ensures the data provided to the component will always be correct
            type: Date,
            // new items added to a collection will be rejected if this is true
            required: true,
            // ..unless we define a default. This means the front-end will never get bad data.
            default: ''
            // if the default is triggered the collection is marked as incomplete, more on this later
        },
        owner: {
            // 
            parent: Store.account
        }
    },
    actions: {
        async getSuggested(self, username) {
            // api routes should be in the actions
            const res = await self.request.get(`/channels/${username}`)

            // the collect method saves the data to the collection
            // the name provided is the "index" which can be used to later filter the collection without writting a getter.
            self.collect('suggested', res.data.channels)
        },
        // collections have access to the global store object
        async getAccount(self) {
            // global state
            self.state
            // global getters
            self.getters
            // other collections
            self.accounts
            // and of course you can collect data for other collections, in case the API returns the data in this route
            const res = await self.request.get(`user/refresh`)
            self.accounts.collect('account', res.data.account)
            self.settings.collect('settings', res.data.settings)
        }
    },
    getters: {

    }
},{
// every collection has options as the second paramater in the class

    // this will reject any data that doesn't fit the model
    strict: true
})

// build the store
new Store({
    collections: {
        channels
    },
    state: {},
    mutations: {},
    actions: {},
    getters: {}
})

// EXAMPLES

// reading the collection state directly is simple, however writing to it is impossible.
Store.channels.state.channelOpen

// ...except for root state, root state is flexible. Allowing for quick global values.
Store.state.something = true

// for collections, a get function is a replacement for a getter, as creating them can sometimes be useless. It allows us to filter our collection by an index, one we set earler on the collect method. 
Store.channels.get('suggested')

//  you can also get the index, by using
Store.channels.getIndex('suggested')
// Returns: [23,435,6373,345...]
// Sometimes you'll need to use the index, in Notify's case we save the index to the server.

// A handy function for moving data from one index to another
Store.channels.move(243, 'suggested', 'subscribed')
// if the index does not already exist, it will be created.

// again saving data to a collection with the same index is easy
Store.channels.collect('suggested', data)

// collections have their own getters



// accounts
// channels
// updates
// posts
// connections
// settings