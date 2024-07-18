import { Telegraf } from "telegraf";
import { message } from "telegraf/filters";
import 'dotenv/config';
import userModel from './src/models/User.js';
import connectDb from './src/config/db.js';
import eventModel from './src/models/Event.js';


//make a instance of a bot
const bot=new Telegraf(process.env.BOT_TOKEN);
//ctx contains all the information of a user that invoked bot


//connecting with database

try{
   connectDb();
   console.log("database connected")
}catch(err){
   console.log(err);
   process.kill(process.pid,'SIGTERM');
}

//start command available from telegraf 
bot.start(async(ctx)=>{
    console.log(ctx);

    //extracting user info
    const from=ctx.update.message.from;
    console.log('from',from);


    //Using the upsert option, you can use findOneAndUpdate() as a find-and-upsert operation. An upsert behaves like a normal findOneAndUpdate() if it finds a document that matches filter. But, if no document matches filter, MongoDB will insert one by combining filter and update as shown below.

    //You should set the new option to true to return the document after update was applied.

    try{
       await userModel.findOneAndUpdate({tgId: from.id},{

        //$setOnInsert :- If an update operation with upsert: true results in an insert of a document, then $setOnInsert assigns the specified values to the fields in the document. If the update operation does not result in an insert, $setOnInsert does nothing.
         $setOnInsert:{
            firstName: from.first_name,
            isBot: from.is_bot,

         }
       },{
        upsert: true,
        new: true
       });

       //store the user info into db

       await ctx.reply(`Hey! ${from.first_name}, Welcome. I will be writing highly engaging social media posts for you just keep feeding me with the events throughout the day. Let's shine on social media.`);
    }catch(err){
    console.log(err);
      await ctx.reply("Facing difficulties!");
    }
    
   
});

//on method provided by telegraf library
bot.on(message('text'),async(ctx)=>{
    // console.log("hello");
    const from=ctx.update.message.from;
    const message=ctx.update.message.text;

    try{
         await eventModel
    }catch(err){

    }

    ctx.reply("Got the messsage");
});

bot.launch(); 

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
