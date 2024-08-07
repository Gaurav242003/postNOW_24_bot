import { Telegraf } from "telegraf";
import { message } from "telegraf/filters";
import 'dotenv/config';
import userModel from './src/models/User.js';
import connectDb from './src/config/db.js';
import eventModel from './src/models/Event.js';
import OpenAI from 'openai';




//make a instance of a bot
const bot=new Telegraf(process.env.BOT_TOKEN);
//ctx contains all the information of a user that invoked bot
const openai = new OpenAI({
    apiKey: process.env['OPENAI_KEY'], // This is the default and can be omitted
  });


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

//command method provided by telegraf library
bot.command('generate',async(ctx)=>{
    const from=ctx.update.message.from;

    const {message_id: waitMsgId}=await ctx.reply(`Hey! ${from.first_name}, kindly wait for a moment. I am curating posts for you.`);

    const startOfTheDay= new Date();
    startOfTheDay.setHours(0,0,0,0);
    const endOfTheDay= new Date();
    endOfTheDay.setHours(23,59,59,999);
    //get today's event for the user
    const events=await eventModel.find({
        tgId: from.id,
        createdAt: {
            $gte:startOfTheDay,
            $lte:endOfTheDay
        }
    });

    if(events.length === 0){
        await ctx.deleteMessage(waitMsgId);
        await ctx.reply('No events for the day.');
        return;
    }

    console.log('events',events);

    //make openai api call
    try{
       const chatCompletion=await openai.chat.completions.create({
         messages:[
            {
                role: 'system',
                content:'Act as senior copywriter, you write highly engaging post for linkedin, facebook and twitter using provided thoughts/events throughout the day.'
            },
            {
                role:'user',
                content:`Write like human, for humans. Craft three engaging social media posts tailored for LinkedIn, Instagram, and Twitter audiences, Use simple language. Use given time labels just to understand the order of the event, do not mention the time in the posts. Each post should creatively highlight the following events. Ensure the tone is conversational and impactful. Focus on engaging the respective platform's audience, encouraging interaction, and driving interest in the events:
        ${events.map((event)=> event.text).join(', ')} 
                `
            }
         ],

         model: process.env.OPENAI_MODEL
       });

       console.log('completion', chatCompletion);

       //store token count
       await userModel.findOneAndUpdate({
        tgId:from.id,
       },
       {
         $inc:{


            promptTokens: chatCompletion.usage.prompt_tokens,
            completionTokens: chatCompletion.usage.completion_tokens
         }
       }
    );
    //delete previous waiting message
    await ctx.deleteMessage(waitMsgId);
       //send the response to the user
    await ctx.reply(chatCompletion.choices[0].message.content);

    }catch(err){
        console.log(err);
        await ctx.deleteMessage(waitMsgId);
        await ctx.reply("Facing difficulties in calling openAI API. Developer's openai api request quota exceeded.")
    }
    
    
    
})

//on method provided by telegraf library
bot.on(message('text'),async(ctx)=>{
    // console.log("hello");
    const from=ctx.update.message.from;
    const message=ctx.update.message.text;
    //stroing all the events that are generated by the user.
    try{
         await eventModel.create({
            text:message,
            tgId:from.id,
         })

         await ctx.reply("Noted. Keep texting me your thoughts. To generate the posts, just enter the command : /generate");
    }catch(err){
        console.log(err);
        await ctx.reply("Facing diffuculties, please try again later.")
    }

    
});




bot.launch(); 

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
