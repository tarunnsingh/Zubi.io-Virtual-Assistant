'use-strict'
const keys = require('./config')
const { 
  dialogflow,
  SimpleResponse,
  Suggestions,
  LinkOutSuggestion,
  BrowseCarousel,
  BrowseCarouselItem,
  Image,
  BasicCard,
  SignIn,
  RegisterUpdate,
  Button,
} = require("actions-on-google");

const admin = require('firebase-admin');
const functions = require('firebase-functions');
const dotenv = require('dotenv');
dotenv.config();
admin.initializeApp();
const auth = admin.auth();
const db = admin.firestore();
db.settings({timestampsInSnapshots: true});

const rp = require('request-promise');
const moment = require('moment')

const keys = require('./config')

const app = dialogflow({clientId:keys.dialogflowClientID}
);

let isLoggedin = false


app.intent('Start Sign-in', async (conv) => {
  if(conv.user.storage.isLoggedin){
    const userData = await auth.getUserByEmail(conv.user.email)
    return(
      conv.ask('You are already Logged In!'),
      conv.ask(new BasicCard({
        text: `___Your Details with Zubi:___  \nName: ${userData.displayName}  \nEmail: ${userData.email}`,
        image: new Image({
          url: `https://drive.google.com/uc?export=view&id=1YOTmpaavdx1z95dGD213PNC5l2YHiCjN`,
          alt: `Zubi Logo`
        }),
        display: 'WHITE'
      })),
      conv.ask(new Suggestions(shuffleGlobal(globalSuggestion)))
    )
  }
  conv.ask(new SignIn('To continue your experience on Zubi'));
});


app.intent('Get Sign-in', async (conv, params, signin) => {
  if (signin.status !== 'OK') {
    return conv.close(`Let's try again next time.`);
  }
  const firstLogin = Date.now()
  const {email} = conv.user
  const picture = conv.user.profile.payload.picture
  const name = conv.user.profile.payload.name
  const given_name = conv.user.profile.payload.given_name
  const userData = {
    email: email,
    photoURL: picture,
    displayName: name,
  }
  if (!conv.user.storage.uid && email) {
    try {
      userRecord = (await auth.getUserByEmail(email));
      console.log('Found from DB : ', userRecord)
      conv.user.storage.uid = userRecord.uid
    } catch (e) {
      if (e.code !== 'auth/user-not-found') {
        throw e;
      } 
      conv.user.storage.uid = (await auth.createUser(userData)).uid;
      console.log('after creating user :' + conv.user.storage.uid)
    }
  }
  if (conv.user.storage.uid) {
    isLoggedin = true
    conv.user.storage.isLoggedin = isLoggedin
    console.log('After Login Done: ', conv.user.storage)
    conv.user.storage.userProfileFromDB = await auth.getUser(conv.user.storage.uid)
    console.log('Taken from DB',  conv.user.userProfileFromDB)
  }
  conv.ask(new SimpleResponse({
    text: `Thank you! ${given_name}.`,
    speech: `Thank you for signing in.`,
  }))
  conv.ask(new SimpleResponse({
    text: `What would you like to do?`,
    speech: `What would you like to do? You can now use all our features`,
  }))
  conv.ask(new Suggestions(shuffleGlobal(globalSuggestion)))
});



app.intent('Default Welcome Intent', async (conv) => {
  const {payload} = conv.user.profile;
  console.log(payload)
  const name = payload ? ` ${payload.given_name}` : '';
  
  conv.ask(`Hi${name}!`);
  conv.ask(new SimpleResponse({
    text: `Welcome to Zubi Forum. What would you like to do?`,
    speech: `Welcome to Zubi Forum. What would you like to do?`,
  }))
  if(conv.user.storage.isLoggedin){
    conv.ask(new Suggestions(shuffleGlobal(globalSuggestion)))
  } else {
    conv.ask(new Suggestions(['Login','What can you do']))
  }
});


app.intent('whatCanYouDo', (conv) => {
  conv.ask(`Here is what I can do.`)
  conv.ask(new BasicCard({
    title: `What you can ask?`,
    subtitle: `Here is a list of features which you can ask Zubi to do.`,
    text: `___For Beginners and Help:___ ` + 
    `Say, '_Beginners and Help_'  \n` + 
    `___For News and Events:___ ` +
    `Say, '_News and Events_'  \n` +
    `___For Webinar/Emergex:___ ` +
    `Say, '_Webinar_'  \n` +
    `___For Latest Posts:___ ` +
    `Say, '_Latest Posts_'  \n` +
    `___For Jobs and Opportunities:___ ` +
    `Say, '_Jobs and Opportunities_'  \n` +
    `___Note:___ _You need to to be logged in to unlock these features_  \n` +
    `You can subscribe for _daily notification updates_ on Jobs and Opportunities from Zubi Forum.`,
    image: new Image({
      url: `https://drive.google.com/uc?export=view&id=1YOTmpaavdx1z95dGD213PNC5l2YHiCjN`,
      alt: 'Logo'
    }),
    buttons: new Button({
      title: 'Visit Zubi Forum',
      url: `https://forum.zubi.io`
    }),
    display: 'WHITE',
  }))
  if(conv.user.storage.isLoggedin){
    conv.ask(new Suggestions(shuffleGlobal(globalSuggestion)))
  } else {
    conv.ask(new Suggestions(['Login']))
  }
});


app.intent('getLatestPosts', (conv) => {
  console.log('Inside Latest Posts:' , conv.user)
  console.log('Conv Object',conv)
  if(conv.user.storage.isLoggedin){
    const options = {
      uri: 'https://forum.zubi.io/posts.json',
      json: true
    }
    return rp(options)
    .then((dataRec) => {
        const data = dataRec.latest_posts
        console.log(data)
        let items = []
        for(let i = 0; i < 10 ; i++){
          items[i] = new BrowseCarouselItem({
            title: `${data[i]['topic_title']}`,
            url: `https://forum.zubi.io/t/${data[i]['topic_slug']}/${data[i]['topic_id']}`,
            description: `${data[i]['raw'].substring(0,220).replace(/ *\([^)]*\) */g, "").replace(/[\[\]']+/g,'')}`,
            footer: `🕒 Last activity ${moment(data[i]['created_at']).fromNow()}`,
          })
        }
        conv.ask(`Here are latest posts:`);
        conv.ask(new BrowseCarousel({
            items: items 
        }));
        conv.ask(new Suggestions(shuffleGlobal(globalSuggestion)))
        conv.ask(new LinkOutSuggestion({
          name: 'Zubi Forum',
          url: 'https://forum.zubi.io/latest',
        }))
    })
    .catch((error) => {
        console.log("Error " + error);
        return conv.close("Something went wrong... ");
    });
  } else {
    conv.ask('You need to Login first!')
    conv.ask(new Suggestions(['Login']))
  } 
})


app.intent('getJobs', (conv) => {
  
  if(conv.user.storage.isLoggedin){
    const options = {
      uri: 'https://forum.zubi.io/c/26.json',
      json: true
    }
    return rp(options)
    .then((dataRec) => {
        const data = dataRec.topic_list.topics
        console.log(data)
        let items = []
        for(let i = 1; i < 6 ; i++){
          console.log(i , data[i]['title'])
          items[i-1] = new BrowseCarouselItem({
            title: `${data[i]['title']}`,
            url: `https://forum.zubi.io/t/${data[i]['slug']}/${data[i]['id']}`,
            description: `🕒Posted ${moment(data[i]['created_at']).fromNow()}`,
            footer: `📝Last activity by ${data[i]['last_poster_username']}, ${moment(data[i]['last_posted_at']).fromNow()}.`,
          })
        }
        conv.ask(`Here are latest posts on Jobs and Opportunities:`);
        conv.ask(new BrowseCarousel({
            items: items 
        }));
        const tempList = Array.from(shuffleGlobal(globalSuggestion))
        tempList.unshift('Send Daily')
        conv.ask(new Suggestions(tempList))
        conv.ask(new LinkOutSuggestion({
          name: 'Zubi Forum',
          url: 'https://forum.zubi.io/c/jobs-opportunities' ,
        }))
    })
    .catch((error) => {
        console.log("Error " + error);
        return conv.close("Something went wrong... ");
    });
  } else {
    conv.ask('You need to Login first!')
    conv.ask(new Suggestions(['Login']))
  }
});

app.intent('Setup Daily Updates', (conv) => {
  conv.ask(new RegisterUpdate({
    intent: 'getJobs',
    frequency: 'DAILY',
  }));
  
})


app.intent("Finish Daily Updates", (conv, params, registered) => {
  console.log('PARAMS:',params)
  if (registered && registered.status === "OK") {
      conv.ask("Ok, I'll start giving you daily updates on Jobs and Opportunities from Zubi.");
      conv.ask(`What else would you like to do?`)
      conv.ask(new Suggestions(shuffleGlobal(globalSuggestion)))
  } else {
      conv.ask("Ok, I won't give you daily updates. What else would you like to do?")
      conv.ask(new Suggestions(shuffleGlobal(globalSuggestion)))
  }
})


app.intent('getBeginners', (conv) => {
  if(conv.user.storage.isLoggedin){
    const options = {
      uri: 'https://forum.zubi.io/c/18.json',
      json: true
    }
    return rp(options)
    .then((dataRec) => {
        const data = dataRec.topic_list.topics
        console.log(data)
        let items = []
        for(let i = 1; i < 6 ; i++){
          console.log(i , data[i]['title'])
          items[i-1] = new BrowseCarouselItem({
            title: `${data[i]['title']}`,
            url: `https://forum.zubi.io/t/${data[i]['slug']}/${data[i]['id']}`,
            description: `🕒Posted ${moment(data[i]['created_at']).fromNow()}`,
            footer: `📝Last activity by ${data[i]['last_poster_username']}, ${moment(data[i]['last_posted_at']).fromNow()}.`,
          })
        }
        conv.ask(`Here are posts on Beginners and Help:`);
        conv.ask(new BrowseCarousel({
            items: items 
        }));
        conv.ask(new Suggestions(shuffleGlobal(globalSuggestion)))
        conv.ask(new LinkOutSuggestion({
          name: 'Zubi Forum',
          url: 'https://forum.zubi.io/c/beginners-and-help' ,
        }))
    })
    .catch((error) => {
        console.log("Error " + error);
        return conv.close("Something went wrong... ");
    });
  } else {
    conv.ask('You need to Login first!')
    conv.ask(new Suggestions(['Login']))
  }
});



app.intent('getNewsEvents', (conv) => {
  if(conv.user.storage.isLoggedin){
    const options = {
      uri: 'https://forum.zubi.io/c/22.json',
      json: true
    }
    return rp(options)
    .then((dataRec) => {
        const data = dataRec.topic_list.topics
        console.log(data)
        let items = []
        for(let i = 1; i < 6 ; i++){
          console.log(i , data[i]['title'])
          items[i-1] = new BrowseCarouselItem({
            title: `${data[i]['title']}`,
            url: `https://forum.zubi.io/t/${data[i]['slug']}/${data[i]['id']}`,
            description: `🕒Posted ${moment(data[i]['created_at']).fromNow()}`,
            footer: `📝Last activity by ${data[i]['last_poster_username']}, ${moment(data[i]['last_posted_at']).fromNow()}.`,
          })
        }
        conv.ask(`Here are posts on News and Events:`);
        conv.ask(new BrowseCarousel({
            items: items 
        }));
        conv.ask(new Suggestions(shuffleGlobal(globalSuggestion)))
        conv.ask(new LinkOutSuggestion({
          name: 'Zubi Forum',
          url: 'https://forum.zubi.io/c/news-and-events' ,
        }))
    })
    .catch((error) => {
        console.log("Error " + error);
        return conv.close("Something went wrong... ");
    });
  } else {
    conv.ask('You need to Login first!')
    conv.ask(new Suggestions(['Login']))
  }
});


app.intent('getWebinar', (conv) => {
  if(conv.user.storage.isLoggedin){
    const options = {
      uri: 'https://forum.zubi.io/c/23.json',
      json: true
    }
    return rp(options)
    .then((dataRec) => {
        const data = dataRec.topic_list.topics
        console.log(data)
        let items = []
        let i = 0
        data.forEach(element => {
          if(i>0 && i<10){
            console.log(i , element['title'])
            items[i-1] = new BrowseCarouselItem({
              title: `${element['title']}`,
              url: `https://forum.zubi.io/t/${element['slug']}/${element['id']}`,
              description: `🕒Posted ${moment(element['created_at']).fromNow()}`,
              footer: `📝Last activity by ${element['last_poster_username']}, ${moment(element['last_posted_at']).fromNow()}.`,
            })
          } i++
        });
        conv.ask(`Here are posts on Webinar - Emergex:`);
        conv.ask(new BrowseCarousel({
            items: items 
        }));
        conv.ask(new Suggestions(shuffleGlobal(globalSuggestion)))
        conv.ask(new LinkOutSuggestion({
          name: 'Zubi Forum',
          url: 'https://forum.zubi.io/c/emergex' ,
        }))
    })
    .catch((error) => {
        console.log("Error " + error);
        return conv.close("Something went wrong... ");
    });
  } else {
    conv.ask('You need to Login first!')
    conv.ask(new Suggestions(['Login']))
  }
});

function shuffleGlobal(array){
  var currentIndex = array.length, temporaryValue, randomIndex;
  while (0 !== currentIndex) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }
  return array;
}

const globalSuggestion = ['Webinar', 'News and Events','Latest Posts','Jobs','Beginners']

exports.fulfillment = functions.https.onRequest(app);