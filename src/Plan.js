
// An attempt to plan the stucture while explaining the logic.
import Store from 'pulse'

// As an example, our current vuex store has these modules:
// - channels
// - updates
// - posts
// - connections
// - account
// - settings
// Some of these modules have one large array of data.
// Most are related to eachother in some way.
// Lots of inefficient filters have to be run on every change to remove duplicates, just in case.
// Modules like channels, posts and updates have one data structure but multiple categories (EG: suggested channels, subscribed channels, muted channels, my channels)
// Lots of mutations and getters have to be written for those, repeating and wasting code.
// All getters have to be global with VueX, which gets real messy. 

// The solution: "collections"

// define the collection class in a constant
const Collection = Store.Collection

// Collections are like modules in vuex but behave more like a mongo database. 
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
            // if the default is triggered the item within the collection is marked as incomplete, more on this later
        },
        owner: {
            type: Number,
            // this is for reactive relations, if this value matches the primary key for the forign collection refrenced here, it will be returned in the getter for this collection, with the property name matching the forign collection. The relation is reactive, meaning if the forigen collection changes, the getters for this collection update also.
            parent: Store.account
            // This ensures we only ever store data once, and changes propergate through our application smoothly.
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
        // the core model of each collection is not an array, so if we want to filter it, we can use "asArray" which will give us an array of all the items in a collection
        getRecentlyActiveChannels: (self) => self.accounts.asArray.filter(channel => channel.lastActive),
        // running a filter on the entire collection could be inefficent, so using an index to narrow it down is also possible
        // indexes are cached, which means we dont repeat the generation of the index unless the data within the index has changed
        // the store knows what items from a collection are in each index, and only when a peice of data changes does the cached index regenerate
        getRecentlyActiveChannels: (self) => self.accounts.get('suggested').filter(channel => channel.lastActive)

    }
},{
// every collection has options as the second paramater in the class

    // this will reject any extra data properties that are not defined in the model, otherwise they are left in
    strict: true,
    
})

// building the store
new Store({
    collections: {
        channels,
        accounts
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

// as get() is a function

// but we can still create and use getters like normal, and they're accessable globally, great for handy filters
Store.getters.getRecentlyActiveChannels


//  you can also get the index, by using
Store.channels.getIndex('suggested')
// Returns: [23,435,6373,345...]
// Sometimes you'll need to use the index, in Notify's case we save the index to the server.

// A handy function for moving data from one index to another
Store.channels.move(243, 'suggested', 'subscribed')
// if the index does not already exist, it will be created.

// Saving data to a collection from outside the collection
Store.channels.collect('suggested', data)

// saving data without an index 
Store.channels.collect(data)

// collections have their own getters



