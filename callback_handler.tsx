import { post } from '@app/request'

const BOT_TOKEN = "PLACE_YOUR_BOT_TOKEN_HERE";
const TG_API_BASE_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;
const ALERT_TEXT = 'Чтобы получить подарок, нужно подписаться на канал!';
const URL_REDIRECT = 't.me/some_bot?start=1111';


export const callbackHandlerHook = app.post("/", async (ctx, req) => {
    let updateBody = req.body;
    //ctx.account.log(`TG update body: ${JSON.stringify(req.body)}, query: ${JSON.stringify(req.query)}, params: ${JSON.stringify(req.params)}, headers: ${JSON.stringify(req.headers)}`);
    //ctx.account.log(`Tg update processed: user ${updateBody.sourcePayload.callback_query.from.id}`)
    if (updateBody.sourcePayload?.callback_query && updateBody.sourcePayload?.callback_query.message.chat.type == 'channel') {
        let query = updateBody;
        try{
            let isUserMember = await isUserSubscribed(updateBody.sourcePayload.callback_query.from.id, updateBody.sourcePayload.callback_query.message.chat.id);
            if(isUserMember) {
                await queryAnswer(query=query, action='url', text=undefined, url=URL_REDIRECT)
            } else { 
                await queryAnswer(query=query, action='alert', text=ALERT_TEXT)
            }
            
        } catch(err) {
            ctx.account.log(`error answering query: ${err}`);
        }
        

    }
    return { status: 'ok', message: 'post acquired' }

});

async function queryAnswer(query: any, action: String, text?: String, url?: String) {
    // action may be 'url', 'alert' or 'text'
    // url is required with action=='url', text is required with action=='alert' || 'text'

    let qid = query.sourcePayload.callback_query.id;
    //ctx.account.log(`query id to answer: ${qid}`);
    

    const headers = {
        'Content-Type': 'application/x-www-form-urlencoded',
    };

    let body = {
        callback_query_id: qid
    };

    if (action == 'alert') {
        body.show_alert = true;
        body.text = text;
    }

    if (action == 'url') {
        //ctx.account.log(`injecting url ${url} into body`);
        body.url = url;
    }
    //ctx.account.log(`preparing callback answer body: ${JSON.stringify(body)}`);
    const options = {
        /*  method: 'POST', */
        throwHttpErrors: false,
        headers: headers,
        form: body,
    };

    try {
        
        const response = await post(`${TG_API_BASE_URL}/answerCallbackQuery`, undefined, options);
        //ctx.account.log(`TG callback answer API response: ${response.statusCode}, body: ${JSON.stringify(response.body)}\n\n request body: ${JSON.stringify(body)}`);

    } catch (error) {
        ctx.account.log(`error: ${error}`)
    }
}


async function isUserSubscribed(user_id: Number, chat_id: Number) {
    
    

    const headers = {
        'Content-Type': 'application/x-www-form-urlencoded',
    };

    let body = {
        user_id: user_id,
        chat_id: chat_id
    };

    const options = {
        /*  method: 'POST', */
        throwHttpErrors: false,
        headers: headers,
        form: body,
    };

    try {
        
        const response = await post(`${TG_API_BASE_URL}/getChatMember`, undefined, options);
        if (response.body.ok) {
            let result = response.body.result;
            if ( result.status == 'left' || result.status == 'kicked' ) {
                return false;
                
            } else {
                return true;
            }
        }
        //ctx.account.log(`TG callback answer API response: ${response.statusCode}, body: ${JSON.stringify(response.body)}\n\n request body: ${JSON.stringify(body)}`);

    } catch (error) {
        //ctx.account.log(`error: ${error}`)
    }
}

import { showContextMenu } from '@app/ui';
app.apiCall('/settings-action', (ctx) => {
  return showContextMenu([
    {
      title: 'Адрес хука',
      onClick: ctx.account.navigate(callbackHandlerHook.url(), {
        openInExternalApp: true,
      }),
    },
  ]);
});
