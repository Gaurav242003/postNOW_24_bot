import { Telegraf } from "telegraf";
import 'dotenv/config';


//make a instance of a bot
const bot=new Telegraf(process.env.BOT_TOKEN);
//ctx contains all the information of a user that invoked bot

//start command available from telegraf 
bot.start(async(ctx)=>{
    console.log(ctx);
    const from=ctx.update.message.from;
    console.log('from',from);
    await ctx.reply("hello from node.js server");
   
});

bot.launch();

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
