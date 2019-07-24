# Zubi.io-Virtual-Assistant
The Cloud Functions for [Google Action](https://assistant.google.com/services/a/uid/000000398989bd20) (Google Assistant) of [Zubi.io](https://zubi.io).

## About Zubi.io
[Zubi.io](https://zubi.io) has the mission to build India's largest student driven community for emerging technologies and provide a complete ecosystem from learning to collboration.
Our vision is to make Zubi a global community in merging technologies to enhance the skillset of students by making latest technologu accessible to all.
Visit the [Zubi Forum](https://forum.zubi.io/) for which the assistant works for.

## Steps for Local Development  
#### Only for Windows. Steps for Mac and Linux to be added soon.
This is the official repo for the cloud functions running behind the Google Assistant bot.  
Built using [NodeJs](https://nodejs.org/en/) runtime version 8 taking references from the official documentation for [Action on Google](https://developers.google.com/actions/overview).
To locally build and develop the bot replicate the following steps:

#### 1. Initilise Firebase
Setup the your local environment to work with cloud functions by installing and authenticating the [Firebase CLI](https://firebase.google.com/docs/cli).For cloud functions to work enter the commmand `firebase init` throught the terminal in your preferred directory.
#### 2. Add Functions folder
Clear the contents of the function folder creted in the previous step and clone this repository in that folder using `git clone https://github.com/thetseffect/Zubi.io-Virtual-Assistant.git`.
#### 3. Import Dialogflow Agent
Once you have replicated the cloud functions, sign in to dialogflow and create a new Agent. Once agent creation is completed head on to settings and click on **Import as ZIP**.
Use the file named **Agent.zip**. Now go to Integrations tab and click on Google Assistant Integration and then click on Test using Actions Console.
#### 4. Deploying Cloud Functions
Now go back to your local directory where you creted your cloud functions. Change your working dirctory to the functions folder and run the command `firebase deploy --projet [PROJECT_ID].`
Project_ID can be found in the Project settings of actions on google console or in the settings tab of your dialogflow agent. Make sure that the ID at both these locations is same. If not, check the account which you are logged in with.
Once the deploy is complete, copy the deployment URL shown in the terminal and paste it in the webhook column of Fullfilment tab of Dialogflow Agent.
#### 5. Test on Actions Simulator
In your actions console go to the tab TEST and test the bot using your queries. You can also test on your Android device with the same Account logged in.

## Further Steps and Development.
Add in more features of your choice and send in your pull request. You can use [Discourse API Docs](https://docs.discourse.org/) for further development.

#### Contacts: Connect with the developer on [Linkedin](https://www.linkedin.com/in/thetseffect/) for any collaborations and projects.

