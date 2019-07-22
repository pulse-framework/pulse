import Library from "./library";
import { defineConfig } from "./helpers";
const pulse = new Library({
  config: {},
  collections: {
    lol: {
      groups: ['haha'],
      model: {
        jeff: {
          hasMany: 'channels',
          assignTo:'channels'
        }
      },
      filters: {
        fuck({ channels }) {
          return channels.filterOne;
        }
      }
    },

    channels: {
      persist: ["openChannel"],
      groups: ["myChannels"],
      routes: {
        getSomething: request =>
          request.get("https://jsonplaceholder.typicode.com/posts")
      },
      data: {
        openChannel: true,
        currentChannel: 32,
        pls: [1, 2],
        deepReactive: {
          thing: true,
          op: {
            cool: {
              luka: true
            }
          }
        }
      },
      actions: {
        test({ channels, routes }) {
          routes.getSomething().then(res => {
            console.log(res);
          });
          channels.currentChannel = "FIRST";
          channels.openChannel = "SECOND";
          return true;
        }
      },
      watch: {},
      filters: {
        filterOne({ channels }) {
          // console.log("Hi, I'm filter One!");
          // console.log(channels.deepReactive)
          return channels.deepReactive.op.cool.luka;
        }
      }
    }
  }
});

pulse.mapData(({ channels, lol }) => {
  return {
    channel: channels.myChannels,
    cool: channels.deepReactive.op.cool.luka,
    ijwefoiewjf: channels.deepReactive.op.cool,
    haha: channels.filterTwo,
    hahaha: lol.thing
  };
});

const sampleData = [];
for (let i = 0; i < 10; i++) {
  sampleData.push({
    id: Math.random(),
    thing: true,
    jeff: "myChannels"
  });
}

pulse.channels.collect(sampleData, 'myChannels')
pulse.lol.collect(sampleData, 'haha')



setTimeout(() => console.log(pulse))
setTimeout(() => console.log(pulse._private.collections.channels))
setTimeout(() => console.log(pulse._private.collections.lol))
